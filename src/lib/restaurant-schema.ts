import type { SupabaseClient } from "@supabase/supabase-js";

export const RESTAURANT_SLUG_COLUMN_CANDIDATES = [
  "slug",
  "restaurant_slug",
  "url_slug",
  "url_id",
] as const;

export type RestaurantSlugColumn =
  | (typeof RESTAURANT_SLUG_COLUMN_CANDIDATES)[number]
  | null;

let cachedSlugColumn: RestaurantSlugColumn | undefined;

function isMissingColumnError(code: string | undefined): boolean {
  return code === "42703";
}

export async function detectRestaurantSlugColumn(
  supabase: SupabaseClient
): Promise<RestaurantSlugColumn> {
  if (cachedSlugColumn !== undefined) {
    return cachedSlugColumn;
  }

  for (const column of RESTAURANT_SLUG_COLUMN_CANDIDATES) {
    const { error } = await supabase.from("restaurants").select(column).limit(1);

    if (!error) {
      cachedSlugColumn = column;
      return column;
    }

    if (!isMissingColumnError(error.code)) {
      console.warn(`[restaurants.schema] Slug probe failed for "${column}":`, error.message);
    }
  }

  cachedSlugColumn = null;
  console.warn(
    "[restaurants.schema] No slug column exists on public.restaurants. Inserts will use name and user_id only; public URLs will fall back to restaurant id."
  );
  return null;
}

export function resolveRestaurantSlugFromRow(
  row: Record<string, unknown>,
  slugColumn: RestaurantSlugColumn = null
): string {
  if (slugColumn) {
    const value = row[slugColumn];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  for (const column of RESTAURANT_SLUG_COLUMN_CANDIDATES) {
    const value = row[column];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return String(row.id ?? "");
}

export function buildRestaurantInsertPayloads(options: {
  userId: string;
  name: string;
  slug: string;
  slugColumn: RestaurantSlugColumn;
  logo?: string | null;
}): Record<string, unknown>[] {
  const core: Record<string, unknown> = {
    user_id: options.userId,
    name: options.name.trim(),
  };

  const withSlug = options.slugColumn
    ? { ...core, [options.slugColumn]: options.slug }
    : core;

  const payloads: Record<string, unknown>[] = [];

  if (options.logo) {
    payloads.push({ ...withSlug, logo_url: options.logo });
    payloads.push({ ...withSlug, logo: options.logo });
  }

  payloads.push(withSlug);

  if (options.slugColumn) {
    payloads.push(core);
  }

  const uniquePayloads: Record<string, unknown>[] = [];
  const seen = new Set<string>();

  for (const payload of payloads) {
    const key = JSON.stringify(payload);
    if (!seen.has(key)) {
      seen.add(key);
      uniquePayloads.push(payload);
    }
  }

  return uniquePayloads;
}

export function buildRestaurantUpdateWithSlug(
  slugColumn: RestaurantSlugColumn,
  slug: string,
  fields: Record<string, unknown>
): Record<string, unknown> {
  if (!slugColumn || !slug.trim()) {
    return fields;
  }

  return { ...fields, [slugColumn]: slug.trim() };
}

export function buildRestaurantSelectWithSlug(
  slugColumn: RestaurantSlugColumn,
  columns: string[]
): string {
  if (!slugColumn || columns.includes(slugColumn) || columns.includes("*")) {
    return columns.join(", ");
  }

  return [...columns, slugColumn].join(", ");
}
