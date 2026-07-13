"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDesign } from "@/contexts/design-context";
import { useRestaurant } from "@/contexts/restaurant-context";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/auth/errors";
import { themeColorsFromDesign } from "@/lib/restaurant-design";
import { serializeMenuThemeColors } from "@/lib/theme-colors";
import { serializeDisplayOptions } from "@/lib/display-options";
import { serializeTypography, resolveCategoryTypography } from "@/lib/typography";
import {
  type ThemeHotspotId,
} from "@/lib/advanced-theme";
import {
  serializeAdvancedThemeWithOverrides,
  THEME_COLOR_PANEL_GROUPS,
} from "@/lib/theme-inheritance";
import { isMissingColumnError } from "@/lib/restaurant-settings";
import { useDashboardLocale } from "@/contexts/dashboard-locale-context";
import { fetchPublicMenuData } from "@/lib/public-menu-fetch";
import { sanitizePublicMenuTree } from "@/lib/public-menu-utils";
import { Button } from "@/components/ui/button";
import { ThemeHotspotPopover } from "@/components/dashboard/theme-hotspot-popover";
import { ThemeColorGroupSection } from "@/components/dashboard/theme-color-group-section";
import { MenuPhonePreview } from "@/components/dashboard/menu-phone-preview";
import { CapsuleNav } from "@/components/dashboard/capsule-nav";
import {
  DesignDisplaySection,
  DesignLogoSeoSection,
  DesignTypographySection,
} from "@/components/dashboard/design-branding-sections";
import { PublicMenuLayout } from "@/components/public/public-menu-layout";
import { PublicMenuFilterProvider } from "@/components/public/public-menu-filter-context";
import { restaurantPreviewProfileFromSummary } from "@/lib/restaurant-preview-profile";
import { publicMenuAbsoluteUrl } from "@/lib/public-menu-url";
import type { PublicMenuParentCategory, PublicMenuSubcategory } from "@/lib/menu-hierarchy";
import { useDashboardSearchParam } from "@/hooks/use-dashboard-search-param";

type StudioTab = "menu" | "colours" | "fonts" | "display" | "logo-seo";

const STUDIO_TAB_IDS: StudioTab[] = ["menu", "colours", "fonts", "display", "logo-seo"];

const STUDIO_TABS: { id: StudioTab; label: string }[] = [
  { id: "menu", label: "Menu" },
  { id: "colours", label: "Colours" },
  { id: "fonts", label: "Fonts" },
  { id: "display", label: "Display" },
  { id: "logo-seo", label: "Logo & SEO" },
];

const MOCK_FLAT: PublicMenuSubcategory[] = [
  {
    id: "preview-starters",
    name: "Starters",
    layout_type: "carousel",
    dishes: [
      {
        id: "d1",
        name: "Truffle Fries",
        description: "Crispy fries with parmesan and truffle oil.",
        price: 12,
        hide_price: false,
        image: null,
        tags: ["Vegetarian"],
        allergens: [],
      },
      {
        id: "d2",
        name: "Soup of the Day",
        description: "Chef's seasonal selection.",
        price: 9,
        hide_price: false,
        image: null,
        tags: ["Vegan", "Gluten-Free"],
        allergens: [],
      },
    ],
  },
  {
    id: "preview-mains",
    name: "Mains",
    layout_type: "stacked",
    dishes: [
      {
        id: "d3",
        name: "Grilled Salmon",
        description: "Atlantic salmon with lemon butter and herbs.",
        price: 24,
        hide_price: false,
        image: null,
        tags: ["Gluten-Free"],
        allergens: ["fish"],
      },
    ],
  },
];

export function DesignStudio() {
  const {
    design,
    advancedTheme,
    themeOverrides,
    resolvedTheme,
    getHotspotGroup,
    getGroupParentColor,
    setGroupParentColor,
    getChildColor,
    setChildColor,
    isChildOverridden,
  } = useDesign();
  const { currentRestaurant, refreshRestaurants } = useRestaurant();
  const { t } = useDashboardLocale();
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useDashboardSearchParam(
    "tab",
    STUDIO_TAB_IDS,
    "menu"
  ) as [StudioTab, (tab: StudioTab) => void];
  const [activeHotspot, setActiveHotspot] = useState<ThemeHotspotId | null>(null);
  const [colorPopover, setColorPopover] = useState<{
    hotspot: ThemeHotspotId;
    position: { top: number; left: number };
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [menu, setMenu] = useState<PublicMenuParentCategory[]>([]);
  const [flatCategories, setFlatCategories] = useState<PublicMenuSubcategory[]>(MOCK_FLAT);
  const [hasNestedStructure, setHasNestedStructure] = useState(false);

  const supabase = getSupabaseBrowserClient();

  const displayOptions = useMemo(
    () => ({
      showPrices: design.showPrices ?? true,
      showDescriptions: design.showDescriptions ?? true,
      showImages: design.showImages ?? true,
      showDietary: design.showDietary ?? true,
    }),
    [design]
  );

  useEffect(() => {
    if (activeTab !== "menu") {
      setColorPopover(null);
      setActiveHotspot(null);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!currentRestaurant?.id) return;

    fetchPublicMenuData(currentRestaurant.id)
      .then((data) => {
        const sanitized = sanitizePublicMenuTree(
          data.menu ?? [],
          data.flatCategories.length > 0 ? data.flatCategories : MOCK_FLAT
        );
        setMenu(sanitized.menu);
        setFlatCategories(sanitized.flatCategories);
        setHasNestedStructure(data.hasNestedStructure);
      })
      .catch((error) => {
        console.error("[DesignStudio:menuPreview]", error);
        const fallback = sanitizePublicMenuTree([], MOCK_FLAT);
        setMenu(fallback.menu);
        setFlatCategories(fallback.flatCategories);
        setHasNestedStructure(false);
      });
  }, [currentRestaurant?.id]);

  const handleHotspotClick = (hotspot: ThemeHotspotId, anchor: DOMRect) => {
    const container = previewContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const popoverWidth = 320;
    const left = Math.min(
      Math.max(anchor.right - containerRect.left + 8, 8),
      containerRect.width - popoverWidth - 8
    );
    const top = Math.min(
      Math.max(anchor.top - containerRect.top + anchor.height / 2 - 60, 8),
      containerRect.height - 180
    );

    setActiveHotspot(hotspot);
    setColorPopover({ hotspot, position: { top, left } });
  };

  const handlePopoverClose = () => {
    setColorPopover(null);
    setActiveHotspot(null);
  };

  const handleSaveDesign = async () => {
    if (!currentRestaurant?.id) return;

    setSaving(true);
    setSaveError(null);

    try {
      const basePayload = {
        logo: design.logo,
        meta_title: design.metaTitle,
        meta_description: design.metaDescription,
        theme_colors: serializeMenuThemeColors(themeColorsFromDesign(design)),
        typography: serializeTypography(design),
        advanced_theme: serializeAdvancedThemeWithOverrides(advancedTheme, themeOverrides),
        ...serializeDisplayOptions({
          showPrices: design.showPrices ?? true,
          showDescriptions: design.showDescriptions ?? true,
          showImages: design.showImages ?? true,
          showDietary: design.showDietary ?? true,
        }),
        updated_at: new Date().toISOString(),
      };

      let advancedColumnMissing = false;

      let { error } = await supabase
        .from("restaurants")
        .update(basePayload)
        .eq("id", currentRestaurant.id);

      if (error && isMissingColumnError(error)) {
        const retryPayload = { ...basePayload };
        delete (retryPayload as { advanced_theme?: unknown }).advanced_theme;
        const retry = await supabase
          .from("restaurants")
          .update(retryPayload)
          .eq("id", currentRestaurant.id);
        error = retry.error;
        if (!error) {
          advancedColumnMissing = true;
        }
      }

      if (error) throw error;

      await refreshRestaurants({ silent: true });

      if (advancedColumnMissing) {
        setSaveError(
          "Design saved. Run supabase/migrations for advanced_theme in Supabase."
        );
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (error) {
      console.error("Error saving design:", error);
      setSaveError(formatSupabaseError(error));
    } finally {
      setSaving(false);
    }
  };

  const profile = useMemo(
    () => restaurantPreviewProfileFromSummary(currentRestaurant),
    [currentRestaurant]
  );

  const previewProps = {
    restaurantName: profile.restaurantName || "Your Restaurant",
    logo: design.logo || currentRestaurant?.logo || null,
    location: profile.location,
    hours: profile.hours,
    contactInfo: profile.contactInfo,
    footerSlogan: profile.footerSlogan,
    theme: resolvedTheme,
    titleFont: design.titleFont,
    bodyFont: design.textFont,
    titleFontWeight: design.titleFontWeight,
    titleFontStyle: design.titleFontStyle,
    ...resolveCategoryTypography(design),
    bodyFontWeight: design.textFontWeight,
    bodyFontStyle: design.textFontStyle,
    menu,
    flatCategories,
    hasNestedStructure,
    links: profile.links,
    display: displayOptions,
  };

  const publicMenuUrl = currentRestaurant?.slug
    ? publicMenuAbsoluteUrl(currentRestaurant.slug)
    : null;

  const activePopoverGroup = colorPopover ? getHotspotGroup(colorPopover.hotspot) : null;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="mb-6 flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="air-page-title">{t("branding.pageTitle")}</h1>
          <p className="air-page-subtitle">
            Parent colours control each region — fine-tune individual elements in the advanced accordion.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {publicMenuUrl && (
            <Button
              variant="light"
              href={publicMenuUrl}
              target="_blank"
              rel="noopener noreferrer"
              isExternal
            >
              View Public Menu
            </Button>
          )}
          <Button
            variant="dark"
            size="lg"
            onClick={handleSaveDesign}
            disabled={saving || !currentRestaurant?.id}
          >
            {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save Design"}
          </Button>
        </div>
      </div>

      {saveError && (
        <div className="mb-4 shrink-0 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {saveError}
        </div>
      )}

      <div className="mb-6 shrink-0">
        <CapsuleNav
          items={STUDIO_TABS}
          active={activeTab}
          onChange={setActiveTab}
          ariaLabel="Design studio sections"
        />
      </div>

      <div className="min-h-0 flex-1">
        {activeTab === "menu" && (
          <div className="air-card air-card-lg flex h-full min-h-[640px] flex-col items-center justify-start p-6 lg:p-10">
            <div ref={previewContainerRef} className="relative w-full max-w-[390px] shrink-0">
              <MenuPhonePreview
                label="Live Preview — tap a palette dot to edit colours in context"
                previewTheme={resolvedTheme}
                previewCanvas
                className="border-0 bg-transparent p-0"
              >
                <PublicMenuFilterProvider syncToUrl={false}>
                  <PublicMenuLayout
                    {...previewProps}
                    previewInteractive={{
                      enabled: true,
                      activeHotspot,
                      onHotspotClick: handleHotspotClick,
                    }}
                  />
                </PublicMenuFilterProvider>
              </MenuPhonePreview>

              {colorPopover && activePopoverGroup && (
                <ThemeHotspotPopover
                  group={activePopoverGroup}
                  parentColor={getGroupParentColor(colorPopover.hotspot)}
                  onParentChange={(color) => setGroupParentColor(colorPopover.hotspot, color)}
                  getChildColor={getChildColor}
                  onChildChange={setChildColor}
                  isChildOverridden={isChildOverridden}
                  position={colorPopover.position}
                  onClose={handlePopoverClose}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === "colours" && (
          <div className="mx-auto h-full max-h-[calc(100vh-14rem)] max-w-2xl overflow-y-auto rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6">
              <h2 className="text-base font-semibold tracking-tight text-slate-900">Colours</h2>
              <p className="mt-1 text-xs text-slate-400">
                Each section has a parent colour that controls the whole region. Expand advanced
                controls to override individual elements — changes sync instantly with the preview.
              </p>
            </div>

            <div className="space-y-4">
              {THEME_COLOR_PANEL_GROUPS.map((group) => (
                <ThemeColorGroupSection
                  key={group.hotspot}
                  group={group}
                  parentColor={getGroupParentColor(group.hotspot)}
                  onParentChange={(color) => setGroupParentColor(group.hotspot, color)}
                  getChildColor={getChildColor}
                  onChildChange={setChildColor}
                  isChildOverridden={isChildOverridden}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === "fonts" && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6">
              <h2 className="text-base font-semibold tracking-tight text-slate-900">Typography</h2>
              <p className="mt-1 text-xs text-slate-400">
                Pick a curated font pairing or fine-tune title, category, and body fonts.
              </p>
            </div>
            <DesignTypographySection showHeading={false} />
          </div>
        )}

        {activeTab === "display" && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6">
              <h2 className="text-base font-semibold tracking-tight text-slate-900">Display Options</h2>
              <p className="mt-1 text-xs text-slate-400">
                Control what guests see on your public menu — prices, descriptions, images, and dietary info.
              </p>
            </div>
            <DesignDisplaySection />
          </div>
        )}

        {activeTab === "logo-seo" && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6">
              <h2 className="text-base font-semibold tracking-tight text-slate-900">Logo & SEO</h2>
              <p className="mt-1 text-xs text-slate-400">
                Upload your logo and set search preview title and description.
              </p>
            </div>
            <DesignLogoSeoSection showHeading={false} />
          </div>
        )}
      </div>
    </div>
  );
}
