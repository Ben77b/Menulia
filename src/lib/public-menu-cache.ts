import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createAnonClient } from "@/lib/supabase";
import { parseMenuThemeColors, DEFAULT_MENU_THEME } from "@/lib/theme-colors";
import {
  resolveUnifiedMenuTheme,
  splitAdvancedThemeStorage,
} from "@/lib/theme-inheritance";
import { fetchPublicMenuData } from "@/lib/public-menu-fetch";
import type { PublicRestaurantProfile } from "@/lib/public-menu-seo";
import { logSupabaseAuditError, withSupabaseFallback } from "@/lib/supabase-safe";
import { getLocalizedText } from "@/lib/utils/i18n-text";
import { resolvePublicMenuLogoSrc } from "@/lib/public-menu-utils";

/** Edge/data-cache TTL for public menu payloads (seconds). */
export const PUBLIC_MENU_REVALIDATE_SECONDS = 60;

export interface PublicMenuSplashTheme {
  restaurantName: string;
  logo: string | null;
  backgroundColor: string;
  accentColor: string;
}

export const DEFAULT_PUBLIC_MENU_SPLASH: PublicMenuSplashTheme = {
  restaurantName: "",
  logo: null,
  backgroundColor: DEFAULT_MENU_THEME.headerBackgroundColor,
  accentColor: DEFAULT_MENU_THEME.categoryAccentColor,
};

type RestaurantRow = Record<string, unknown>;

/** Columns needed for public menu SSR — avoid select("*"). */
const PUBLIC_RESTAURANT_COLUMNS = [
  "id",
  "name",
  "slug",
  "logo",
  "location",
  "hours",
  "contact_info",
  "footer_slogan",
  "meta_title",
  "meta_description",
  "custom_links",
  "primary_language",
  "theme_colors",
  "advanced_theme",
  "typography",
  "show_prices",
  "show_descriptions",
  "show_images",
  "show_dietary",
].join(", ");

async function queryRestaurantBySlug(slug: string): Promise<RestaurantRow | null> {
  return withSupabaseFallback(
    "public-menu.queryRestaurantBySlug",
    async () => {
      const supabase = createAnonClient();
      const { data, error } = await supabase
        .from("restaurants")
        .select(PUBLIC_RESTAURANT_COLUMNS)
        .eq("slug", slug)
        .single();

      if (error) {
        // Narrow column set may fail on older schemas — fall back to *.
        const fallback = await supabase.from("restaurants").select("*").eq("slug", slug).single();
        if (fallback.error) {
          logSupabaseAuditError("public-menu.queryRestaurantBySlug", fallback.error);
          return null;
        }
        return (fallback.data as RestaurantRow) ?? null;
      }
      return (data as RestaurantRow) ?? null;
    },
    null
  );
}

function cachedRestaurantBySlug(slug: string) {
  const normalized = slug.trim().toLowerCase();
  return unstable_cache(
    () => queryRestaurantBySlug(normalized),
    ["public-restaurant", normalized],
    {
      revalidate: PUBLIC_MENU_REVALIDATE_SECONDS,
      tags: ["public-menu", `public-menu:${normalized}`],
    }
  )();
}

function cachedMenuPayload(restaurantId: string, slug: string) {
  const normalizedSlug = slug.trim().toLowerCase();
  return unstable_cache(
    () => fetchPublicMenuData(restaurantId),
    ["public-menu-payload-v4", restaurantId],
    {
      revalidate: PUBLIC_MENU_REVALIDATE_SECONDS,
      tags: ["public-menu", `public-menu:${normalizedSlug}`],
    }
  )();
}

export function restaurantRowToProfile(
  row: RestaurantRow,
  slugFallback: string
): PublicRestaurantProfile {
  const slug = (row.slug as string) ?? slugFallback;
  return {
    id: row.id as string,
    name: getLocalizedText(row.name) || slug,
    slug,
    location: getLocalizedText(row.location),
    contact_info: typeof row.contact_info === "string" ? row.contact_info : "",
    meta_title: getLocalizedText(row.meta_title),
    meta_description: getLocalizedText(row.meta_description),
    logo: resolvePublicMenuLogoSrc((row.logo as string | null) ?? null, slug),
    footer_slogan: getLocalizedText(row.footer_slogan),
  };
}

export function restaurantRowToSplashTheme(row: RestaurantRow | null): PublicMenuSplashTheme {
  if (!row) return DEFAULT_PUBLIC_MENU_SPLASH;

  try {
    const basicTheme = parseMenuThemeColors(row.theme_colors);
    const { theme: advancedTheme, overrides } = splitAdvancedThemeStorage(row.advanced_theme);
    const theme = resolveUnifiedMenuTheme(basicTheme, advancedTheme, overrides);
    const slug = typeof row.slug === "string" ? row.slug : "";

    return {
      restaurantName: getLocalizedText(row.name),
      logo: resolvePublicMenuLogoSrc((row.logo as string | null) ?? null, slug),
      backgroundColor:
        theme.logoAreaBg ||
        theme.headerBackgroundColor ||
        DEFAULT_MENU_THEME.headerBackgroundColor,
      accentColor:
        theme.logoAreaText ||
        theme.categoryAccentColor ||
        DEFAULT_MENU_THEME.categoryAccentColor,
    };
  } catch (error) {
    logSupabaseAuditError("public-menu.restaurantRowToSplashTheme", error);
    return DEFAULT_PUBLIC_MENU_SPLASH;
  }
}

/** Request-deduped + edge-cached restaurant row for public menu routes. */
export const getPublicRestaurantRow = cache(async (slug: string): Promise<RestaurantRow | null> => {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;
  return cachedRestaurantBySlug(normalized);
});

/** Request-deduped + edge-cached menu tree (categories + dishes). */
export const getPublicMenuPayload = cache(
  async (restaurantId: string, slug: string) => {
    return withSupabaseFallback(
      "public-menu.getPublicMenuPayload",
      () => cachedMenuPayload(restaurantId, slug),
      { menu: [], flatCategories: [], hasNestedStructure: false }
    );
  }
);

export async function getPublicMenuSplashBySlug(slug: string): Promise<PublicMenuSplashTheme> {
  const row = await getPublicRestaurantRow(slug);
  return restaurantRowToSplashTheme(row);
}
