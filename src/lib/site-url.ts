const PRODUCTION_SITE_URL = "https://menulia.net";

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

  if (configured) {
    return configured;
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "menulia.net" || host === "www.menulia.net") {
      return PRODUCTION_SITE_URL;
    }
  }

  return PRODUCTION_SITE_URL;
}

export function getPublicMenuUrl(slug: string): string {
  return `${getSiteUrl()}/menu/${slug}`;
}
