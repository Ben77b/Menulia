import { unstable_cache } from "next/cache";
import { createAnonClient } from "@/lib/supabase";
import { parseMenuThemeColors, DEFAULT_MENU_THEME } from "@/lib/theme-colors";
import {
  resolveUnifiedMenuTheme,
  splitAdvancedThemeStorage,
} from "@/lib/theme-inheritance";
import { fetchPublicMenuData } from "@/lib/public-menu-fetch";
import type { PublicRestaurantProfile } from "@/lib/public-menu-seo";

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

/** Seconds between public menu payload revalidations (ISR). */
export const PUBLIC_MENU_REVALIDATE_SECONDS = 60;

type RestaurantRow = Record<string, unknown>;

async function queryRestaurantBySlug(slug: string): Promise<RestaurantRow | null> {
  const supabase = createAnonClient();
  const { data, error } = await supabase.from("restaurants").select("*").eq("slug", slug).single();
  if (error || !data) return null;
  return data as RestaurantRow;
}

export function restaurantRowToProfile(row: RestaurantRow, slugFallback: string): PublicRestaurantProfile {
  return {
    id: row.id as string,
    name: (row.name as string) ?? "",
    slug: (row.slug as string) ?? slugFallback,
    location: (row.location as string) ?? "",
    contact_info: (row.contact_info as string) ?? "",
    meta_title: (row.meta_title as string) ?? "",
    meta_description: (row.meta_description as string) ?? "",
    logo: (row.logo as string | null) ?? null,
    footer_slogan: (row.footer_slogan as string) ?? "",
  };
}

export function restaurantRowToSplashTheme(row: RestaurantRow | null): PublicMenuSplashTheme {
  if (!row) return DEFAULT_PUBLIC_MENU_SPLASH;

  const basicTheme = parseMenuThemeColors(row.theme_colors);
  const { theme: advancedTheme, overrides } = splitAdvancedThemeStorage(row.advanced_theme);
  const theme = resolveUnifiedMenuTheme(basicTheme, advancedTheme, overrides);

  return {
    restaurantName: (row.name as string) ?? "",
    logo: (row.logo as string | null) ?? null,
    backgroundColor: theme.headerBackgroundColor,
    accentColor: theme.categoryAccentColor,
  };
}

export async function getPublicRestaurantRow(slug: string): Promise<RestaurantRow | null> {
  return unstable_cache(
    () => queryRestaurantBySlug(slug),
    ["public-restaurant-row", slug],
    {
      revalidate: PUBLIC_MENU_REVALIDATE_SECONDS,
      tags: [`public-menu:${slug}`],
    }
  )();
}

export async function getPublicMenuPayload(restaurantId: string) {
  return unstable_cache(
    () => fetchPublicMenuData(restaurantId),
    ["public-menu-payload", restaurantId],
    {
      revalidate: PUBLIC_MENU_REVALIDATE_SECONDS,
      tags: [`public-menu-data:${restaurantId}`],
    }
  )();
}

export async function getPublicMenuSplashBySlug(slug: string): Promise<PublicMenuSplashTheme> {
  const row = await getPublicRestaurantRow(slug);
  return restaurantRowToSplashTheme(row);
}
