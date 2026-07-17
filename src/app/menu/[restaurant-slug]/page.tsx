export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { parseMenuThemeColors } from "@/lib/theme-colors";
import {
  resolveUnifiedMenuTheme,
  splitAdvancedThemeStorage,
} from "@/lib/theme-inheritance";
import { PublicMenuShell } from "@/components/public/public-menu-shell";
import { PublicMenuDocumentBackground } from "@/components/public/public-menu-document-background";
import { PublicMenuJsonLd } from "@/components/public/public-menu-json-ld";
import {
  getPublicMenuPayload,
  getPublicRestaurantRow,
  restaurantRowToProfile,
} from "@/lib/public-menu-cache";
import {
  buildPublicMenuPageMetadata,
  fetchPublicRestaurantBySlug,
} from "@/lib/public-menu-seo";
import { parseCustomLinks } from "@/lib/restaurant-links";
import { parseDisplayOptions } from "@/lib/display-options";
import { normalizePrimaryLanguage } from "@/lib/menu-content-languages";
import { parseTypography } from "@/lib/typography";
import { DEFAULT_DESIGN } from "@/lib/restaurant-design";

interface PageProps {
  params: Promise<{ "restaurant-slug": string }>;
}

function resolveFonts(typography: Record<string, unknown> | null | undefined) {
  return parseTypography(typography, {
    titleFont: DEFAULT_DESIGN.titleFont,
    textFont: DEFAULT_DESIGN.textFont,
  });
}

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const slugParam = resolvedParams["restaurant-slug"];
  const restaurant = await fetchPublicRestaurantBySlug(slugParam);

  if (!restaurant) {
    return {
      title: { absolute: `Menu — ${slugParam}` },
      description: "Restaurant menu on menulia.net",
    };
  }

  return buildPublicMenuPageMetadata(restaurant);
}

export default async function PublicMenuPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slugParam = resolvedParams["restaurant-slug"];

  const restaurant = await getPublicRestaurantRow(slugParam);
  if (!restaurant) notFound();

  const profile = restaurantRowToProfile(restaurant, slugParam);
  const restaurantId = profile.id;

  const [{ menu, flatCategories, hasNestedStructure }] = await Promise.all([
    getPublicMenuPayload(restaurantId),
  ]);

  const links = parseCustomLinks(restaurant.custom_links);
  const display = parseDisplayOptions(restaurant);
  const basicTheme = parseMenuThemeColors(restaurant.theme_colors);
  const { theme: advancedTheme, overrides } = splitAdvancedThemeStorage(restaurant.advanced_theme);
  const theme = resolveUnifiedMenuTheme(basicTheme, advancedTheme, overrides);
  const fonts = resolveFonts(
    restaurant.typography && typeof restaurant.typography === "object"
      ? (restaurant.typography as Record<string, unknown>)
      : undefined
  );
  const defaultLocale = normalizePrimaryLanguage(restaurant.primary_language);

  return (
    <div className="public-menu-enter" data-menulia-public-menu="v3">
      <PublicMenuJsonLd
        restaurant={profile}
        menu={menu}
        flatCategories={flatCategories}
        hasNestedStructure={hasNestedStructure}
      />
      <PublicMenuDocumentBackground color={theme.headerBackgroundColor} />
      <PublicMenuShell
        restaurantName={(restaurant.name as string) ?? ""}
        logo={(restaurant.logo as string | null) ?? null}
        location={(restaurant.location as string | null) ?? ""}
        hours={(restaurant.hours as string | null) ?? ""}
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
        menu={menu ?? []}
        flatCategories={flatCategories ?? []}
        hasNestedStructure={Boolean(hasNestedStructure)}
        links={links ?? []}
        display={display}
      />
    </div>
  );
}
