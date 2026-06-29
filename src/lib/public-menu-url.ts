const DEFAULT_PUBLIC_ORIGIN = "https://menulia.net";

/** Relative path to a restaurant's public menu */
export function publicMenuPath(slug: string): string {
  return `/menu/${slug}`;
}

/** Absolute production URL for opening the live public menu in a new tab */
export function publicMenuAbsoluteUrl(slug: string): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const origin =
    configured ||
    (typeof window !== "undefined" ? window.location.origin : DEFAULT_PUBLIC_ORIGIN);
  return `${origin}${publicMenuPath(slug)}`;
}
