const DEFAULT_SITE_URL = "https://menulia.net";

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return configured || DEFAULT_SITE_URL;
}

export function getPublicMenuUrl(slug: string): string {
  return `${getSiteUrl()}/${slug}`;
}
