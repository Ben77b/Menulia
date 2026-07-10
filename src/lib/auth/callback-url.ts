const PRODUCTION_AUTH_ORIGIN = "https://www.menulia.net";

/** Supabase auth redirect target — recovery emails land here before routing to `next`. */
export function getAuthCallbackUrl(nextPath: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

  if (configured && /localhost|127\.0\.0\.1/.test(configured)) {
    return `${configured}/auth/callback?next=${encodeURIComponent(nextPath)}`;
  }

  return `${PRODUCTION_AUTH_ORIGIN}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}
