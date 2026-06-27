import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Canonical restaurants table contract (supabase/migrations + supabase-schema.sql):
 * - id          UUID primary key
 * - user_id     UUID owner reference (references public.profiles.id)
 * - name        TEXT required display name
 * - slug        TEXT unique public URL identifier
 * - logo_url    TEXT brand image (migration schema)
 * - logo        TEXT brand image (legacy supabase-schema.sql)
 */

export const RESTAURANT_OWNER_COLUMN = "user_id" as const;
export const RESTAURANT_SLUG_COLUMN = "slug" as const;
export const RESTAURANT_NAME_COLUMN = "name" as const;

export const RESTAURANT_OWNER_COLUMN_CANDIDATES = [
  "user_id",
  "profile_id",
  "owner_id",
  "created_by",
] as const;

export const RESTAURANT_SLUG_COLUMN_CANDIDATES = [
  "slug",
  "restaurant_slug",
  "url_slug",
  "url_id",
] as const;

export type RestaurantOwnerColumn =
  | (typeof RESTAURANT_OWNER_COLUMN_CANDIDATES)[number]
  | null;

export type RestaurantSlugColumn =
  | (typeof RESTAURANT_SLUG_COLUMN_CANDIDATES)[number]
  | null;

export type RestaurantLogoColumn = "logo_url" | "logo" | null;

export interface RestaurantTableSchema {
  ownerColumn: RestaurantOwnerColumn;
  slugColumn: RestaurantSlugColumn;
  logoColumn: RestaurantLogoColumn;
}

let cachedSchema: RestaurantTableSchema | null = null;
let schemaResolution: Promise<RestaurantTableSchema> | null = null;

export function isSchemaColumnMissing(code: string | undefined): boolean {
  return code === "42703" || code === "PGRST204";
}

async function probeRestaurantColumn(
  supabase: SupabaseClient,
  column: string
): Promise<boolean> {
  const { error } = await supabase.from("restaurants").select(column).limit(1);
  return !error;
}

export function invalidateRestaurantTableSchema(): void {
  cachedSchema = null;
  schemaResolution = null;
}

export async function resolveRestaurantTableSchema(
  supabase: SupabaseClient,
  force = false
): Promise<RestaurantTableSchema> {
  if (!force && cachedSchema) {
    return cachedSchema;
  }

  if (!force && schemaResolution) {
    return schemaResolution;
  }

  schemaResolution = (async () => {
    let ownerColumn: RestaurantOwnerColumn = null;

    for (const column of RESTAURANT_OWNER_COLUMN_CANDIDATES) {
      if (await probeRestaurantColumn(supabase, column)) {
        ownerColumn = column;
        break;
      }
    }

    let slugColumn: RestaurantSlugColumn = null;

    for (const column of RESTAURANT_SLUG_COLUMN_CANDIDATES) {
      if (await probeRestaurantColumn(supabase, column)) {
        slugColumn = column;
        break;
      }
    }

    let logoColumn: RestaurantLogoColumn = null;

    if (await probeRestaurantColumn(supabase, "logo_url")) {
      logoColumn = "logo_url";
    } else if (await probeRestaurantColumn(supabase, "logo")) {
      logoColumn = "logo";
    }

    const schema: RestaurantTableSchema = {
      ownerColumn,
      slugColumn,
      logoColumn,
    };

    cachedSchema = schema;

    console.info("[restaurants.schema:resolved]", {
      ownerColumn: schema.ownerColumn ?? "MISSING",
      slugColumn: schema.slugColumn ?? "MISSING",
      logoColumn: schema.logoColumn ?? "MISSING",
      canonicalOwnerColumn: RESTAURANT_OWNER_COLUMN,
      canonicalSlugColumn: RESTAURANT_SLUG_COLUMN,
    });

    if (!schema.ownerColumn) {
      console.error(
        "[restaurants.schema] No owner column detected on public.restaurants. Expected user_id. Apply supabase/migrations/20250627000002_ensure_restaurants_owner_column.sql in Supabase."
      );
    }

    if (!schema.slugColumn) {
      console.warn(
        "[restaurants.schema] No slug column detected on public.restaurants. Public URLs will use restaurant id until slug is added."
      );
    }

    return schema;
  })();

  return schemaResolution;
}

export async function detectRestaurantSlugColumn(
  supabase: SupabaseClient
): Promise<RestaurantSlugColumn> {
  const schema = await resolveRestaurantTableSchema(supabase);
  return schema.slugColumn;
}

export function resolveRestaurantOwnerFromRow(
  row: Record<string, unknown>,
  schema: RestaurantTableSchema | null = null
): string {
  if (schema?.ownerColumn) {
    const value = row[schema.ownerColumn];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  for (const column of RESTAURANT_OWNER_COLUMN_CANDIDATES) {
    const value = row[column];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return "";
}

export function resolveRestaurantSlugFromRow(
  row: Record<string, unknown>,
  schema: RestaurantTableSchema | null = null
): string {
  const slugColumn = schema?.slugColumn ?? null;

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

export function buildRestaurantInsertPayload(options: {
  schema: RestaurantTableSchema;
  userId: string;
  name: string;
  slug: string;
  logo?: string | null;
}): Record<string, unknown> {
  if (!options.schema.ownerColumn) {
    throw new Error(
      "The restaurants table is missing an owner column (expected user_id). Run the Supabase schema migration to add user_id before creating restaurants."
    );
  }

  const payload: Record<string, unknown> = {
    [RESTAURANT_NAME_COLUMN]: options.name.trim(),
    [options.schema.ownerColumn]: options.userId,
  };

  if (options.schema.slugColumn) {
    payload[options.schema.slugColumn] = options.slug;
  }

  if (options.logo && options.schema.logoColumn) {
    payload[options.schema.logoColumn] = options.logo;
  }

  return payload;
}

export function buildRestaurantUpdateWithSlug(
  schema: RestaurantTableSchema,
  slug: string,
  fields: Record<string, unknown>
): Record<string, unknown> {
  if (!schema.slugColumn || !slug.trim()) {
    return fields;
  }

  return { ...fields, [schema.slugColumn]: slug.trim() };
}

export async function queryRestaurantsForOwner(
  supabase: SupabaseClient,
  userId: string
): Promise<{ data: Record<string, unknown>[]; schema: RestaurantTableSchema }> {
  const schema = await resolveRestaurantTableSchema(supabase);

  if (!schema.ownerColumn) {
    return { data: [], schema };
  }

  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq(schema.ownerColumn, userId)
    .order("created_at", { ascending: true });

  if (error) {
    if (isSchemaColumnMissing(error.code)) {
      invalidateRestaurantTableSchema();
      const refreshedSchema = await resolveRestaurantTableSchema(supabase, true);

      if (!refreshedSchema.ownerColumn) {
        throw error;
      }

      const retry = await supabase
        .from("restaurants")
        .select("*")
        .eq(refreshedSchema.ownerColumn, userId)
        .order("created_at", { ascending: true });

      if (retry.error) {
        throw retry.error;
      }

      return { data: retry.data ?? [], schema: refreshedSchema };
    }

    throw error;
  }

  return { data: data ?? [], schema };
}
