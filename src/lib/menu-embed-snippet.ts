import { getPublicMenuUrl } from "@/lib/site-url";

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildMenuEmbedSnippet(slug: string, restaurantName: string): string {
  const url = getPublicMenuUrl(slug);
  const title = escapeHtmlAttribute(`${restaurantName.trim() || "Restaurant"} Menu`);

  return `<iframe src="${url}" width="100%" height="800px" style="border:none; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);" title="${title}"></iframe>`;
}
