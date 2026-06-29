"use client";

import { useEffect, useMemo, useState } from "react";
import { PublicMenuLayout } from "@/components/public/public-menu-layout";
import { MenuPhonePreview } from "@/components/dashboard/menu-phone-preview";
import { useRestaurant } from "@/contexts/restaurant-context";
import { restaurantPreviewProfileFromSummary } from "@/lib/restaurant-preview-profile";
import { fetchPublicMenuData } from "@/lib/public-menu-fetch";
import { sanitizePublicMenuTree } from "@/lib/public-menu-utils";
import {
  parseCustomLinks,
  normalizeLinkInputs,
  type RestaurantLinkInput,
} from "@/lib/restaurant-links";
import { parseDisplayOptions } from "@/lib/display-options";
import { parseMenuThemeColors } from "@/lib/theme-colors";
import {
  resolveUnifiedMenuTheme,
  splitAdvancedThemeStorage,
} from "@/lib/theme-inheritance";
import { parseTypography, resolveCategoryTypography } from "@/lib/typography";
import { formatContactInfo } from "@/lib/contact-info";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { compileHoursSchedule, type HoursScheduleBlock } from "@/lib/hours-schedule";
import type { PublicMenuParentCategory, PublicMenuSubcategory } from "@/lib/menu-hierarchy";
import type { ResolvedMenuTheme } from "@/lib/advanced-theme";
import type { PublicMenuDisplayOptions } from "@/lib/display-options";

export interface SettingsLivePreviewInput {
  restaurantName: string;
  location: string;
  phone: string;
  email: string;
  scheduleBlocks: HoursScheduleBlock[];
  footerSlogan: string;
  links: RestaurantLinkInput[];
}

interface SettingsMenuPreviewProps {
  restaurantId: string | undefined;
  live: SettingsLivePreviewInput;
}

const MOCK_FLAT: PublicMenuSubcategory[] = [
  {
    id: "preview-starters",
    name: "Starters",
    layout_type: "carousel",
    dishes: [
      {
        id: "d1",
        name: "Seasonal Soup",
        description: "Chef's daily selection.",
        price: 9,
        image: null,
        tags: ["Vegetarian"],
        allergens: [],
      },
    ],
  },
];

interface PreviewFonts {
  titleFont: string;
  textFont: string;
  titleFontWeight: number;
  titleFontStyle: "normal" | "italic";
  categoryFont: string;
  categoryFontWeight: number;
  categoryFontStyle: "normal" | "italic";
  textFontWeight: number;
  textFontStyle: "normal" | "italic";
}

export function SettingsMenuPreview({ restaurantId, live }: SettingsMenuPreviewProps) {
  const { currentRestaurant } = useRestaurant();
  const contextProfile = useMemo(
    () => restaurantPreviewProfileFromSummary(currentRestaurant),
    [currentRestaurant]
  );
  const [loading, setLoading] = useState(true);
  const [logo, setLogo] = useState<string | null>(null);
  const [menu, setMenu] = useState<PublicMenuParentCategory[]>([]);
  const [flatCategories, setFlatCategories] = useState<PublicMenuSubcategory[]>(MOCK_FLAT);
  const [hasNestedStructure, setHasNestedStructure] = useState(false);
  const [theme, setTheme] = useState<ResolvedMenuTheme>(() =>
    resolveUnifiedMenuTheme(parseMenuThemeColors(null), {}, new Set())
  );
  const [fonts, setFonts] = useState<PreviewFonts>({
    titleFont: "Inter",
    textFont: "Inter",
    titleFontWeight: 400,
    titleFontStyle: "normal",
    categoryFont: "Inter",
    categoryFontWeight: 400,
    categoryFontStyle: "normal",
    textFontWeight: 400,
    textFontStyle: "normal",
  });
  const [display, setDisplay] = useState<PublicMenuDisplayOptions>(parseDisplayOptions({}));
  const [savedLinks, setSavedLinks] = useState<ReturnType<typeof parseCustomLinks>>([]);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const id = restaurantId;
    const supabase = getSupabaseBrowserClient();

    async function load() {
      setLoading(true);
      try {
        const [{ data: restaurant }, menuData] = await Promise.all([
          supabase.from("restaurants").select("*").eq("id", id).single(),
          fetchPublicMenuData(id),
        ]);

        if (cancelled) return;

        if (restaurant) {
          setLogo((restaurant.logo as string | null) ?? null);
          setSavedLinks(parseCustomLinks(restaurant.custom_links));

          const basicTheme = parseMenuThemeColors(restaurant.theme_colors);
          const { theme: advancedTheme, overrides } = splitAdvancedThemeStorage(
            restaurant.advanced_theme
          );
          setTheme(resolveUnifiedMenuTheme(basicTheme, advancedTheme, overrides));

          const typography = parseTypography(
            restaurant.typography && typeof restaurant.typography === "object"
              ? (restaurant.typography as Record<string, unknown>)
              : undefined
          );
          const category = resolveCategoryTypography(typography);
          setFonts({
            titleFont: typography.titleFont,
            textFont: typography.textFont,
            titleFontWeight: typography.titleFontWeight,
            titleFontStyle: typography.titleFontStyle,
            categoryFont: category.categoryFont,
            categoryFontWeight: category.categoryFontWeight,
            categoryFontStyle: category.categoryFontStyle,
            textFontWeight: typography.textFontWeight,
            textFontStyle: typography.textFontStyle,
          });
          setDisplay(parseDisplayOptions(restaurant));
        }

        const sanitized = sanitizePublicMenuTree(
          menuData?.menu ?? [],
          menuData?.flatCategories?.length ? menuData.flatCategories : MOCK_FLAT
        );
        setMenu(sanitized.menu);
        setFlatCategories(sanitized.flatCategories);
        setHasNestedStructure(menuData?.hasNestedStructure ?? false);
      } catch (error) {
        console.error("[SettingsMenuPreview:load]", error);
        if (!cancelled) {
          const fallback = sanitizePublicMenuTree([], MOCK_FLAT);
          setMenu(fallback.menu);
          setFlatCategories(fallback.flatCategories);
          setHasNestedStructure(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  const previewProps = useMemo(() => {
    const hours = compileHoursSchedule(live.scheduleBlocks);
    const contactInfo = formatContactInfo(live.phone, live.email);
    const links =
      live.links.some((l) => l.label.trim() || l.url.trim())
        ? normalizeLinkInputs(live.links)
        : savedLinks.length > 0
          ? savedLinks
          : contextProfile.links;

    return {
      restaurantName: live.restaurantName || contextProfile.restaurantName || "Your Restaurant",
      logo,
      location: live.location,
      hours,
      contactInfo,
      footerSlogan: live.footerSlogan,
      theme,
      titleFont: fonts.titleFont,
      bodyFont: fonts.textFont,
      titleFontWeight: fonts.titleFontWeight,
      titleFontStyle: fonts.titleFontStyle,
      categoryFont: fonts.categoryFont,
      categoryFontWeight: fonts.categoryFontWeight,
      categoryFontStyle: fonts.categoryFontStyle,
      bodyFontWeight: fonts.textFontWeight,
      bodyFontStyle: fonts.textFontStyle,
      menu,
      flatCategories,
      hasNestedStructure,
      links,
      display,
    };
  }, [live, logo, theme, fonts, menu, flatCategories, hasNestedStructure, savedLinks, display, contextProfile]);

  return (
    <MenuPhonePreview
      label={loading ? "Loading preview…" : "Live Preview — updates as you edit"}
      className="sticky top-6 hidden lg:flex"
    >
      {!loading && <PublicMenuLayout {...previewProps} />}
    </MenuPhonePreview>
  );
}
