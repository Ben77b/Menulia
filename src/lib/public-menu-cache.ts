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

async function queryRestaurantBySlug(slug: string): Promise<RestaurantRow | null> {
  return withSupabaseFallback(
    "public-menu.queryRestaurantBySlug",
    async () => {
      const supabase = createAnonClient();
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) {
        logSupabaseAuditError("public-menu.queryRestaurantBySlug", error);
        return null;
      }
      return (data as RestaurantRow) ?? null;
    },
    null
  );
}

export function restaurantRowToProfile(row: RestaurantRow, slugFallback: string): PublicRestaurantProfile {
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
      // Match Design Studio header / logo-area so loading overlays align with the header.
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

export async function getPublicRestaurantRow(slug: string): Promise<RestaurantRow | null> {
  return queryRestaurantBySlug(slug);
}

export async function getPublicMenuPayload(restaurantId: string) {
  return withSupabaseFallback(
    "public-menu.getPublicMenuPayload",
    () => fetchPublicMenuData(restaurantId),
    { menu: [], flatCategories: [], hasNestedStructure: false }
  );
}

export async function getPublicMenuSplashBySlug(slug: string): Promise<PublicMenuSplashTheme> {
  const row = await getPublicRestaurantRow(slug);
  return restaurantRowToSplashTheme(row);
}
