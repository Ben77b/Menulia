import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { applySecurityHeadersForPath } from "@/lib/security-headers";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

function withSecurityHeaders(response: NextResponse, pathname: string): NextResponse {
  return applySecurityHeadersForPath(response, pathname);
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

  return withSecurityHeaders(response, pathname);
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/login",
    "/signup",
    "/logout",
    "/onboarding",
    "/menu/:path*",
    "/api/:path*",
  ],
};
