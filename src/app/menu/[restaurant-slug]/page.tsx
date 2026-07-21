export const revalidate = 86400;

import { notFound } from "next/navigation";
import { parseMenuThemeColors, DEFAULT_MENU_THEME } from "@/lib/theme-colors";
import {
  resolveUnifiedMenuTheme,
  splitAdvancedThemeStorage,
} from "@/lib/theme-inheritance";
import { PublicMenuShell } from "@/components/public/public-menu-shell";
import { PublicMenuDocumentBackground } from "@/components/public/public-menu-document-background";
import { PublicMenuJsonLd } from "@/components/public/public-menu-json-ld";
import { PublicMenuViewBeacon } from "@/components/public/public-menu-view-beacon";
import {
  getPublicMenuPayload,
  getPublicRestaurantRow,
  restaurantRowToProfile,
} from "@/lib/public-menu-cache";
import {
  buildPublicMenuPageMetadata,
  fetchPublicRestaurantBySlug,
  normalizePublicMenuLang,
} from "@/lib/public-menu-seo";
import { parseCustomLinks } from "@/lib/restaurant-links";
import { DEFAULT_DISPLAY_OPTIONS, parseDisplayOptions } from "@/lib/display-options";
import { normalizePrimaryLanguage } from "@/lib/menu-content-languages";
import { parseTypography } from "@/lib/typography";
import { DEFAULT_DESIGN } from "@/lib/restaurant-design";
import { getLocalizedText } from "@/lib/utils/i18n-text";
import type { PublicMenuParentCategory, PublicMenuSubcategory } from "@/lib/menu-hierarchy";
import type { ResolvedMenuTheme } from "@/lib/advanced-theme";

interface PageProps {
  params: Promise<{ "restaurant-slug": string }>;
  searchParams?: Promise<{ lang?: string | string[] }>;
}

function resolveFonts(typography: Record<string, unknown> | null | undefined) {
  try {
    return parseTypography(typography, {
      titleFont: DEFAULT_DESIGN.titleFont,
      textFont: DEFAULT_DESIGN.textFont,
    });
  } catch {
    return parseTypography(undefined, {
      titleFont: DEFAULT_DESIGN.titleFont,
      textFont: DEFAULT_DESIGN.textFont,
    });
  }
}

function pickLangParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function safeTheme(restaurant: Record<string, unknown> | null): ResolvedMenuTheme {
  try {
    const basicTheme = parseMenuThemeColors(restaurant?.theme_colors);
    const { theme: advancedTheme, overrides } = splitAdvancedThemeStorage(
      restaurant?.advanced_theme
    );
    return resolveUnifiedMenuTheme(basicTheme, advancedTheme, overrides);
  } catch (error) {
    console.error("[public-menu.theme]", error);
    return resolveUnifiedMenuTheme(DEFAULT_MENU_THEME, {}, new Set());
  }
}

export async function generateMetadata({ params, searchParams }: PageProps) {
  try {
    const resolvedParams = await params;
    const resolvedSearch = searchParams ? await searchParams : {};
    const slugParam = resolvedParams["restaurant-slug"];
    const lang = normalizePublicMenuLang(pickLangParam(resolvedSearch.lang));
    const restaurant = await fetchPublicRestaurantBySlug(slugParam);

    if (!restaurant) {
      return {
        title: { absolute: `Menu — ${slugParam}` },
        description: "Restaurant menu on Menulia",
      };
    }

    return buildPublicMenuPageMetadata(restaurant, lang);
  } catch (error) {
    console.error("[public-menu.generateMetadata]", error);
    return {
      title: { absolute: "Menu" },
      description: "Restaurant menu on Menulia",
    };
  }
}

export default async function PublicMenuPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const slugParam = resolvedParams["restaurant-slug"] ?? "";
  const lang = normalizePublicMenuLang(pickLangParam(resolvedSearch.lang));

  let restaurant: Record<string, unknown> | null = null;
  try {
    restaurant = await getPublicRestaurantRow(slugParam);
  } catch (error) {
    console.error("[Supabase Audit Error]:", "public-menu.restaurant", error);
  }

  if (!restaurant) {
    notFound();
  }

  const profile = restaurantRowToProfile(restaurant, slugParam);
  const restaurantId = typeof profile.id === "string" ? profile.id : "";

  let menu: PublicMenuParentCategory[] = [];
  let flatCategories: PublicMenuSubcategory[] = [];
  let hasNestedStructure = false;

  try {
    const payload = restaurantId
      ? await getPublicMenuPayload(restaurantId)
      : { menu: [], flatCategories: [], hasNestedStructure: false };
    menu = Array.isArray(payload?.menu) ? payload.menu : [];
    flatCategories = Array.isArray(payload?.flatCategories) ? payload.flatCategories : [];
    hasNestedStructure = Boolean(payload?.hasNestedStructure);
  } catch (error) {
    console.error("[Supabase Audit Error]:", "public-menu.payload", error);
  }

  const theme = safeTheme(restaurant);
  const fonts = resolveFonts(
    restaurant.typography && typeof restaurant.typography === "object"
      ? (restaurant.typography as Record<string, unknown>)
      : undefined
  );

  let links = [] as ReturnType<typeof parseCustomLinks>;
  try {
    links = parseCustomLinks(restaurant.custom_links) ?? [];
  } catch {
    links = [];
  }

  let display = DEFAULT_DISPLAY_OPTIONS;
  try {
    display = parseDisplayOptions(restaurant);
  } catch {
    display = DEFAULT_DISPLAY_OPTIONS;
  }

  const defaultLocale = normalizePrimaryLanguage(restaurant.primary_language);
  const restaurantName =
    getLocalizedText(restaurant.name, defaultLocale) || profile.name || slugParam;

  return (
    <div className="public-menu-enter">
      {restaurantId ? <PublicMenuViewBeacon restaurantId={restaurantId} /> : null}
      <PublicMenuJsonLd
        restaurant={profile}
        menu={menu}
        flatCategories={flatCategories}
        hasNestedStructure={hasNestedStructure}
        lang={lang}
      />
      <PublicMenuDocumentBackground
        color={theme?.headerBackgroundColor || DEFAULT_MENU_THEME.headerBackgroundColor}
      />
      <PublicMenuShell
        restaurantName={restaurantName}
        restaurantSlug={slugParam}
        logo={(restaurant.logo as string | null) ?? null}
        location={getLocalizedText(restaurant.location, defaultLocale) || ""}
        hours={typeof restaurant.hours === "string" ? restaurant.hours : ""}
        contactInfo={(restaurant.contact_info as string | null) ?? ""}
        footerSlogan={(restaurant.footer_slogan as string | null) ?? ""}
        defaultLocale={defaultLocale}
        theme={theme}
        titleFont={fonts.titleFont}
        bodyFont={fonts.textFont}
        titleFontWeight={fonts.titleFontWeight}
        titleFontStyle={fonts.titleFontStyle}
        categoryFont={fonts.categoryFont}
        categoryFontWeight={fonts.categoryFontWeight}
        categoryFontStyle={fonts.categoryFontStyle}
        bodyFontWeight={fonts.textFontWeight}
        bodyFontStyle={fonts.textFontStyle}
        menu={menu}
        flatCategories={flatCategories}
        hasNestedStructure={hasNestedStructure}
        links={links}
        display={display}
      />
    </div>
  );
}
