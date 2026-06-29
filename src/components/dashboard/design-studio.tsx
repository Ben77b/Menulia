"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
  THEME_HOTSPOT_GROUPS,
} from "@/lib/theme-inheritance";
import { isMissingColumnError } from "@/lib/restaurant-settings";
import { fetchPublicMenuData } from "@/lib/public-menu-fetch";
import { Button } from "@/components/ui/button";
import { ThemeHotspotPopover } from "@/components/dashboard/theme-hotspot-popover";
import { ThemeColorGroupSection } from "@/components/dashboard/theme-color-group-section";
import { MenuPhonePreview } from "@/components/dashboard/menu-phone-preview";
import {
  DesignDisplaySection,
  DesignLogoSeoSection,
  DesignTypographySection,
} from "@/components/dashboard/design-branding-sections";
import { PublicMenuLayout } from "@/components/public/public-menu-layout";
import { cn } from "@/lib/utils";
import type { PublicMenuParentCategory, PublicMenuSubcategory } from "@/lib/menu-hierarchy";
import { restaurantPreviewProfileFromSummary } from "@/lib/restaurant-preview-profile";

type StudioTab = "menu" | "colours" | "fonts" | "display" | "logo-seo";

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
        image: null,
        tags: ["Vegetarian"],
      },
      {
        id: "d2",
        name: "Soup of the Day",
        description: "Chef's seasonal selection.",
        price: 9,
        image: null,
        tags: ["Vegan", "Gluten-Free"],
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
        image: null,
        tags: ["Gluten-Free"],
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
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<StudioTab>("menu");
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
    if (!currentRestaurant?.id) return;

    fetchPublicMenuData(currentRestaurant.id).then((data) => {
      if (data.flatCategories.length > 0 || data.menu.length > 0) {
        setMenu(data.menu);
        setFlatCategories(data.flatCategories.length > 0 ? data.flatCategories : MOCK_FLAT);
        setHasNestedStructure(data.hasNestedStructure);
      }
    });
  }, [currentRestaurant?.id]);

  const handleHotspotClick = (hotspot: ThemeHotspotId, anchor: DOMRect) => {
    const container = previewContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const popoverWidth = 224;
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

      await refreshRestaurants();

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

  const publicMenuUrl = currentRestaurant?.slug ? `/menu/${currentRestaurant.slug}` : null;

  const activePopoverGroup = colorPopover ? getHotspotGroup(colorPopover.hotspot) : null;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Design Studio</h1>
          <p className="mt-1 text-sm text-gray-600">
            Parent colours control each region — fine-tune individual elements in the advanced accordion.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {publicMenuUrl && (
            <Link
              href={publicMenuUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              🔗 View Public Menu
            </Link>
          )}
          <Button
            size="lg"
            className="px-8"
            onClick={handleSaveDesign}
            disabled={saving || !currentRestaurant?.id}
          >
            {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save Design"}
          </Button>
        </div>
      </div>

      {saveError && (
        <div className="mb-4 shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {saveError}
        </div>
      )}

      <div className="mb-4 shrink-0 border-b border-gray-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Design studio sections">
          {STUDIO_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "whitespace-nowrap border-b-2 px-5 py-3 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-0 flex-1">
        {activeTab === "menu" && (
          <div className="flex h-full min-h-[640px] flex-col items-center justify-start rounded-xl border border-gray-200 bg-gradient-to-b from-gray-100 to-gray-200 p-6 lg:p-10">
            <div ref={previewContainerRef} className="relative w-full max-w-[390px] shrink-0">
              <MenuPhonePreview
                label="Live Preview — tap a palette dot to edit colours in context"
                previewTheme={resolvedTheme}
                previewCanvas
                className="border-0 bg-transparent p-0"
              >
                <PublicMenuLayout
                  {...previewProps}
                  previewInteractive={{
                    enabled: true,
                    activeHotspot,
                    onHotspotClick: handleHotspotClick,
                  }}
                />
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
          <div className="mx-auto h-full max-h-[calc(100vh-14rem)] max-w-2xl overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Colours</h2>
              <p className="mt-1 text-sm text-gray-600">
                Each section has a parent colour that controls the whole region. Expand advanced
                controls to override individual elements — changes sync instantly with the preview.
              </p>
            </div>

            <div className="space-y-4">
              {THEME_HOTSPOT_GROUPS.map((group) => (
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
          <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <DesignTypographySection showHeading={false} />
          </div>
        )}

        {activeTab === "display" && (
          <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold text-gray-900">Display Options</h2>
            <DesignDisplaySection />
          </div>
        )}

        {activeTab === "logo-seo" && (
          <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <DesignLogoSeoSection showHeading={false} />
          </div>
        )}
      </div>
    </div>
  );
}
