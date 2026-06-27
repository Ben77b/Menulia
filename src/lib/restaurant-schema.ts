export const RESTAURANT_OWNER_COLUMN = "user_id" as const;
export const RESTAURANT_SLUG_COLUMN = "slug" as const;
export const RESTAURANT_NAME_COLUMN = "name" as const;

const SLUG_PATTERN = /^[a-z0-9-]+$/;

export function normalizeRestaurantSlug(rawSlug: string): string {
  const normalized = rawSlug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!normalized || !SLUG_PATTERN.test(normalized)) {
    throw new Error("URL slug must contain only lowercase letters, numbers, and hyphens.");
  }

  return normalized;
}

export function resolveRestaurantSlugFromRow(row: Record<string, unknown>): string {
  const slug = row[RESTAURANT_SLUG_COLUMN];
  if (typeof slug === "string" && slug.length > 0) {
    return slug;
  }

  return String(row.id ?? "");
}

export function resolveRestaurantOwnerFromRow(row: Record<string, unknown>): string {
  const ownerId = row[RESTAURANT_OWNER_COLUMN];
  if (typeof ownerId === "string" && ownerId.length > 0) {
    return ownerId;
  }

  return "";
}
