import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { applySecurityHeadersForPath } from "@/lib/security-headers";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

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

  response.cookies.getAll().forEach((cookie) => {
    next.cookies.set(cookie.name, cookie.value);
  });

  return withSecurityHeaders(next, request.nextUrl.pathname);
}

function handleMarketingLocale(request: NextRequest, response: NextResponse): NextResponse | null {
  const { pathname } = request.nextUrl;

  if (shouldSkipLocale(pathname)) {
    return null;
  }

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/en/, "") || "/";
    return withSecurityHeaders(NextResponse.redirect(url), pathname);
  }

  if (pathname === "/es" || pathname.startsWith("/es/")) {
    return withLocaleHeader(request, response, "es");
  }

  if (pathname === "/" || pathname === "/testimonials") {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/en" : "/en/testimonials";
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-locale", "en");
    const rewrite = NextResponse.rewrite(url, { request: { headers: requestHeaders } });

    response.cookies.getAll().forEach((cookie) => {
      rewrite.cookies.set(cookie.name, cookie.value);
    });

    return withSecurityHeaders(rewrite, pathname);
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

  if ((pathname === "/login" || pathname === "/signup") && user) {
    return withSecurityHeaders(response, pathname);
  }

  const localeResponse = handleMarketingLocale(request, response);
  if (localeResponse) {
    return localeResponse;
  }

  return withSecurityHeaders(response, pathname);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
