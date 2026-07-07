import { NextResponse } from "next/server";

const FRAME_ANCESTORS_ANY = "frame-ancestors *";
const FRAME_ANCESTORS_NONE = "frame-ancestors 'none'";

export function isPublicMenuPath(pathname: string): boolean {
  return pathname === "/menu" || pathname.startsWith("/menu/");
}

export function isEmbedProtectedPath(pathname: string): boolean {
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/logout" ||
    pathname === "/onboarding" ||
    pathname.startsWith("/api/")
  );
}

export function applyPublicMenuEmbedHeaders(response: NextResponse): NextResponse {
  response.headers.delete("X-Frame-Options");
  response.headers.set("Content-Security-Policy", FRAME_ANCESTORS_ANY);
  return response;
}

export function applyEmbedDeniedHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Content-Security-Policy", FRAME_ANCESTORS_NONE);
  return response;
}

export function applySecurityHeadersForPath(
  response: NextResponse,
  pathname: string
): NextResponse {
  if (isPublicMenuPath(pathname)) {
    return applyPublicMenuEmbedHeaders(response);
  }

  if (isEmbedProtectedPath(pathname)) {
    return applyEmbedDeniedHeaders(response);
  }

  return response;
}
