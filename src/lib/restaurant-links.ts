export interface RestaurantLink {
  id: string;
  label: string;
  url: string;
}

export interface RestaurantLinkInput {
  id?: string;
  label: string;
  url: string;
}

export type StoredCustomLink = {
  id?: string;
  label: string;
  url: string;
};

export const CUSTOM_LINKS_SQL_HINT =
  'Paste supabase/PASTE_IN_SUPABASE.sql into Supabase → SQL Editor and click Run, then refresh this page.';

export function normalizeLinkInputs(links: RestaurantLinkInput[]): RestaurantLink[] {
  return links
    .map((link, index) => {
      let url = link.url.trim();
      if (url && !/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
      }

      return {
        id: link.id?.trim() || `link-${index}-${Date.now()}`,
        label: link.label.trim(),
        url,
      };
    })
    .filter((link) => link.label.length > 0 && link.url.length > 0);
}

export function parseCustomLinks(raw: unknown): RestaurantLink[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter(
      (link): link is StoredCustomLink =>
        Boolean(link) &&
        typeof link === "object" &&
        typeof (link as StoredCustomLink).label === "string" &&
        typeof (link as StoredCustomLink).url === "string"
    )
    .map((link, index) => ({
      id: link.id?.trim() || `link-${index}`,
      label: link.label.trim(),
      url: link.url.trim(),
    }))
    .filter((link) => link.label.length > 0 && link.url.length > 0);
}

export function serializeCustomLinks(links: RestaurantLinkInput[]): StoredCustomLink[] {
  return normalizeLinkInputs(links).map(({ id, label, url }) => ({ id, label, url }));
}
