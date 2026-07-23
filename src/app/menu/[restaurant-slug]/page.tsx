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
import { resolvePublicMenuLogoSrc } from "@/lib/public-menu-utils";
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
  console.error("[public-menu.page] render start");

  try {
    const resolvedParams = await params;
    const resolvedSearch = searchParams ? await searchParams : {};
    const slugParam = resolvedParams?.["restaurant-slug"] ?? "";
    const lang = normalizePublicMenuLang(pickLangParam(resolvedSearch?.lang));

    console.error("[public-menu.page] slug", slugParam, "lang", lang);

    const restaurant = await getPublicRestaurantRow(slugParam);
    if (!restaurant) {
      notFound();
    }

    const profile = restaurantRowToProfile(restaurant, slugParam);
    const restaurantId = typeof profile?.id === "string" ? profile.id : "";
    const defaultLocale = normalizePrimaryLanguage(restaurant?.primary_language);
    const restaurantName =
      getLocalizedText(restaurant?.name, defaultLocale) ||
      getLocalizedText(profile?.name, defaultLocale) ||
      slugParam;

    let menu: PublicMenuParentCategory[] = [];
    let flatCategories: PublicMenuSubcategory[] = [];
    let hasNestedStructure = false;

    if (restaurantId) {
      try {
        const payload = await getPublicMenuPayload(restaurantId);
        menu = Array.isArray(payload?.menu) ? payload.menu : [];
        flatCategories = Array.isArray(payload?.flatCategories)
          ? payload.flatCategories
          : [];
        hasNestedStructure = Boolean(payload?.hasNestedStructure);
      } catch (menuError) {
        console.error("[public-menu.page] menu payload", menuError);
      }
    }

    console.error(
      "[public-menu.page] data",
      "categories",
      hasNestedStructure ? menu?.length : flatCategories?.length,
      "nested",
      hasNestedStructure
    );

    const theme = safeTheme(restaurant);
    const fonts = resolveFonts(
      restaurant?.typography && typeof restaurant.typography === "object"
        ? (restaurant.typography as Record<string, unknown>)
        : undefined
    );
    const links = (() => {
      try {
        return parseCustomLinks(restaurant?.custom_links) ?? [];
      } catch {
        return [];
      }
    })();
    const display = (() => {
      try {
        return parseDisplayOptions(restaurant ?? {});
      } catch {
        return DEFAULT_DISPLAY_OPTIONS;
      }
    })();

    // http(s) logos pass through; large data: logos become `/api/public-menu-logo?slug=…`
    const logo = resolvePublicMenuLogoSrc(
      typeof restaurant?.logo === "string" ? restaurant.logo : null,
      slugParam
    );

    const location = getLocalizedText(restaurant?.location, defaultLocale) || "";
    const hours = getLocalizedText(restaurant?.hours, defaultLocale) || "";
    const footerSlogan =
      getLocalizedText(restaurant?.footer_slogan, defaultLocale) || "";
    const contactInfo =
      typeof restaurant?.contact_info === "string" ? restaurant.contact_info : "";

    return (
      <div className="public-menu-enter">
        {restaurantId ? <PublicMenuViewBeacon restaurantId={restaurantId} /> : null}
        <PublicMenuJsonLd
          restaurant={{ ...profile, logo }}
          menu={menu}
          flatCategories={flatCategories}
          hasNestedStructure={hasNestedStructure}
          lang={lang}
        />
        <PublicMenuDocumentBackground
          color={
            theme?.menuBackground ||
            theme?.headerBackgroundColor ||
            DEFAULT_MENU_THEME.mainContentBackgroundColor
          }
        />
        <PublicMenuShell
          restaurantName={restaurantName}
          restaurantSlug={slugParam}
          logo={logo}
          location={location}
          hours={hours}
          contactInfo={contactInfo}
          footerSlogan={footerSlogan}
          defaultLocale={defaultLocale}
          theme={theme}
          titleFont={fonts?.titleFont || DEFAULT_DESIGN.titleFont}
          bodyFont={fonts?.textFont || DEFAULT_DESIGN.textFont}
          titleFontWeight={fonts?.titleFontWeight}
          titleFontStyle={fonts?.titleFontStyle}
          categoryFont={fonts?.categoryFont || fonts?.titleFont || DEFAULT_DESIGN.titleFont}
          categoryFontWeight={fonts?.categoryFontWeight}
          categoryFontStyle={fonts?.categoryFontStyle}
          bodyFontWeight={fonts?.textFontWeight}
          bodyFontStyle={fonts?.textFontStyle}
          menu={menu ?? []}
          flatCategories={flatCategories ?? []}
          hasNestedStructure={hasNestedStructure}
          links={links ?? []}
          display={display ?? DEFAULT_DISPLAY_OPTIONS}
        />
      </div>
    );
  } catch (error) {
    console.error("[public-menu.page] FATAL", error);
    // Last-resort visible shell — never an empty/black document.
    return (
      <div className="flex min-h-screen flex-col bg-white px-4 py-10 text-slate-900">
        <p className="mx-auto w-full max-w-4xl text-lg font-semibold tracking-tight">
          Menu
        </p>
        <p className="mx-auto mt-2 w-full max-w-4xl text-sm text-slate-500">
          This menu could not be loaded right now. Please refresh.
        </p>
      </div>
    );
  }
}
