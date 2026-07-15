import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolvePreferredLocale } from "@/lib/locale-detection";
import { applySecurityHeadersForPath } from "@/lib/security-headers";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

const LOCALE_COOKIE = "menulia_locale";

const LOCALE_SKIP_PREFIXES = [
  "/dashboard",
  "/login",
  "/signup",
  "/logout",
  "/onboarding",
  "/menu",
  "/api",
  "/auth",
  "/legal",
  "/privacy",
  "/terms",
];

function withSecurityHeaders(response: NextResponse, pathname: string): NextResponse {
  return applySecurityHeadersForPath(response, pathname);
}

function shouldSkipLocale(pathname: string): boolean {
  return LOCALE_SKIP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function setLocaleCookie(response: NextResponse, locale: "en" | "es") {
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value);
  });
}

function prefersSpanish(request: NextRequest): boolean {
  return resolvePreferredLocale(request.headers.get("accept-language") ?? "") === "es";
}

function ensureLocaleCookie(request: NextRequest, response: NextResponse): NextResponse {
  const stored = getStoredLocale(request);
  const locale =
    stored ?? resolvePreferredLocale(request.headers.get("accept-language") ?? "");
  return withLocaleHeader(request, response, locale);
}

function getStoredLocale(request: NextRequest): "en" | "es" | null {
  const value = request.cookies.get(LOCALE_COOKIE)?.value;
  if (value === "en" || value === "es") return value;
  return null;
}

function withLocaleHeader(
  request: NextRequest,
  response: NextResponse,
  locale: "en" | "es"
): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", locale);
  const next = NextResponse.next({
    request: { headers: requestHeaders },
  });

  copyCookies(response, next);
  setLocaleCookie(next, locale);

  return withSecurityHeaders(next, request.nextUrl.pathname);
}

function rewriteEnglish(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
  internalPath: string
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = internalPath;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", "en");
  const rewrite = NextResponse.rewrite(url, { request: { headers: requestHeaders } });

  copyCookies(response, rewrite);
  setLocaleCookie(rewrite, "en");

  return withSecurityHeaders(rewrite, pathname);
}

function redirectWithSessionCookies(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
  destination: string
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = destination;
  url.search = "";
  const redirect = NextResponse.redirect(url);
  copyCookies(response, redirect);
  return withSecurityHeaders(redirect, pathname);
}

function handleAuthenticatedEntryRedirect(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
  user: { id: string } | null
): NextResponse | null {
  if (!user) return null;

  if (pathname === "/") {
    return redirectWithSessionCookies(request, response, pathname, "/dashboard");
  }

  if (pathname === "/login" || pathname === "/signup") {
    return redirectWithSessionCookies(request, response, pathname, "/dashboard");
  }

  return null;
}

function handleMarketingLocale(request: NextRequest, response: NextResponse): NextResponse | null {
  const { pathname } = request.nextUrl;

  if (shouldSkipLocale(pathname)) {
    return null;
  }

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/en/, "") || "/";
    const redirect = NextResponse.redirect(url);
    setLocaleCookie(redirect, "en");
    return withSecurityHeaders(redirect, pathname);
  }

  if (pathname === "/es" || pathname.startsWith("/es/")) {
    return withLocaleHeader(request, response, "es");
  }

  if (pathname === "/") {
    const stored = getStoredLocale(request);

    if (stored === "es" || (!stored && prefersSpanish(request))) {
      const url = request.nextUrl.clone();
      url.pathname = "/es";
      const redirect = NextResponse.redirect(url);
      copyCookies(response, redirect);
      setLocaleCookie(redirect, "es");
      return withSecurityHeaders(redirect, pathname);
    }

    return rewriteEnglish(request, response, pathname, "/en");
  }

  if (pathname === "/testimonials") {
    return rewriteEnglish(request, response, pathname, "/en/testimonials");
  }

  return null;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/dashboard") && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return withSecurityHeaders(NextResponse.redirect(loginUrl), pathname);
  }

  const authenticatedRedirect = handleAuthenticatedEntryRedirect(
    request,
    response,
    pathname,
    user
  );
  if (authenticatedRedirect) {
    return authenticatedRedirect;
  }

  const localeResponse = handleMarketingLocale(request, response);
  if (localeResponse) {
    return localeResponse;
  }

  return ensureLocaleCookie(request, response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
