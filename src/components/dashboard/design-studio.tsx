"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useDesign } from "@/contexts/design-context";
import { useRestaurant } from "@/contexts/restaurant-context";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/auth/errors";
import { themeColorsFromDesign } from "@/lib/restaurant-design";
import { serializeMenuThemeColors, normalizeHexColor } from "@/lib/theme-colors";
import { serializeDisplayOptions } from "@/lib/display-options";
import { serializeTypography, resolveCategoryTypography } from "@/lib/typography";
import { serializeThemeMode } from "@/lib/theme-mode";
import {
  ADVANCED_THEME_SECTIONS,
  HOTSPOT_LABELS,
  serializeAdvancedTheme,
  type ThemeHotspotId,
} from "@/lib/advanced-theme";
import type { ThemeColorFieldId } from "@/lib/theme-color-fields";
import { isMissingColumnError } from "@/lib/restaurant-settings";
import { fetchPublicMenuData } from "@/lib/public-menu-fetch";
import { Button } from "@/components/ui/button";
import { ToggleSwitch } from "@/components/dashboard/toggle-switch";
import { HotspotColorPopover } from "@/components/dashboard/hotspot-color-popover";
import {
  DesignCategoryStylingSection,
  DesignDisplaySection,
  DesignLogoSeoSection,
  DesignTypographySection,
} from "@/components/dashboard/design-branding-sections";
import { PublicMenuLayout } from "@/components/public/public-menu-layout";
import { cn } from "@/lib/utils";
import type { PublicMenuParentCategory, PublicMenuSubcategory } from "@/lib/menu-hierarchy";
import type { RestaurantLink } from "@/lib/restaurant-links";

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

interface ColorPopoverState {
  hotspot: ThemeHotspotId;
  position: { top: number; left: number };
}

function StudioColorPicker({
  id,
  label,
  value,
  fallback,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  fallback: string;
  onChange: (value: string) => void;
}) {
  return (
    <div id={id} className="scroll-mt-24 rounded-lg p-3 transition-all duration-300">
      <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
          <input
            type="color"
            value={normalizeHexColor(value, fallback)}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer border-0 p-0"
          />
        </div>
        <span className="font-mono text-xs text-gray-600">{normalizeHexColor(value, fallback)}</span>
      </div>
    </div>
  );
}

export function DesignStudio() {
  const {
    design,
    advancedTheme,
    themeMode,
    resolvedTheme,
    setThemeMode,
    getColorValue,
    setColorValue,
    getHotspotColor,
    setHotspotColor,
  } = useDesign();
  const { currentRestaurant, refreshRestaurants } = useRestaurant();
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<StudioTab>("menu");
  const [activeHotspot, setActiveHotspot] = useState<ThemeHotspotId | null>(null);
  const [colorPopover, setColorPopover] = useState<ColorPopoverState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [menu, setMenu] = useState<PublicMenuParentCategory[]>([]);
  const [flatCategories, setFlatCategories] = useState<PublicMenuSubcategory[]>(MOCK_FLAT);
  const [hasNestedStructure, setHasNestedStructure] = useState(false);

  const supabase = getSupabaseBrowserClient();
  const isAdvancedMode = themeMode === "advanced";

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
        theme_mode: serializeThemeMode(themeMode),
        theme_colors: serializeMenuThemeColors(themeColorsFromDesign(design)),
        typography: serializeTypography(design),
        advanced_theme: serializeAdvancedTheme(advancedTheme),
        ...serializeDisplayOptions({
          showPrices: design.showPrices ?? true,
          showDescriptions: design.showDescriptions ?? true,
          showImages: design.showImages ?? true,
          showDietary: design.showDietary ?? true,
        }),
        updated_at: new Date().toISOString(),
      };

      let advancedColumnMissing = false;
      let themeModeMissing = false;

      let { error } = await supabase
        .from("restaurants")
        .update(basePayload)
        .eq("id", currentRestaurant.id);

      if (error && isMissingColumnError(error)) {
        const retryPayload = { ...basePayload };
        delete (retryPayload as { advanced_theme?: unknown }).advanced_theme;
        delete (retryPayload as { theme_mode?: unknown }).theme_mode;
        const retry = await supabase
          .from("restaurants")
          .update(retryPayload)
          .eq("id", currentRestaurant.id);
        error = retry.error;
        if (!error) {
          advancedColumnMissing = true;
          themeModeMissing = true;
        }
      }

      if (error) throw error;

      await refreshRestaurants();

      if (advancedColumnMissing || themeModeMissing) {
        setSaveError(
          "Design saved. Run supabase/migrations/20250702000000_theme_mode.sql (and advanced_theme migration if needed) in Supabase."
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

  const previewProps = {
    restaurantName: currentRestaurant?.name ?? "Your Restaurant",
    logo: design.logo || null,
    location: design.location || "123 Main Street",
    hours: "Mon–Fri: 11:00 – 22:00\nSat–Sun: 10:00 – 23:00",
    contactInfo: design.contactInfo || "+1 555 0100 | hello@restaurant.com",
    footerSlogan: "Fresh ingredients, crafted with care.",
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
    links: [] as RestaurantLink[],
    display: displayOptions,
  };

  const publicMenuUrl = currentRestaurant?.slug ? `/menu/${currentRestaurant.slug}` : null;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Design Studio</h1>
          <p className="mt-1 text-sm text-gray-600">
            {isAdvancedMode
              ? "Advanced layer active — granular colours from your saved palette"
              : "Basic layer active — macro colours with auto-contrast"}
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
            <p className="mb-6 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
              Live Preview — tap a palette dot to edit colours in context
            </p>
            <div ref={previewContainerRef} className="relative w-full max-w-[390px] shrink-0">
              <div className="overflow-hidden rounded-[2.75rem] border-[10px] border-gray-900 bg-gray-900 shadow-2xl">
                <div className="flex items-center justify-center bg-gray-900 py-2">
                  <div className="h-1 w-16 rounded-full bg-gray-700" />
                </div>
                <div className="h-[720px] overflow-y-auto bg-white">
                  <PublicMenuLayout
                    {...previewProps}
                    previewInteractive={{
                      enabled: true,
                      activeHotspot,
                      onHotspotClick: handleHotspotClick,
                    }}
                  />
                </div>
                <div className="flex items-center justify-center bg-gray-900 py-3">
                  <div className="h-1 w-28 rounded-full bg-gray-700" />
                </div>
              </div>

              {colorPopover && (
                <HotspotColorPopover
                  label={HOTSPOT_LABELS[colorPopover.hotspot]}
                  color={getHotspotColor(colorPopover.hotspot)}
                  fallback="#ffffff"
                  position={colorPopover.position}
                  onPreviewChange={(value) => setHotspotColor(colorPopover.hotspot, value)}
                  onApply={handlePopoverClose}
                  onClose={handlePopoverClose}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === "colours" && (
          <div className="mx-auto h-full max-h-[calc(100vh-14rem)] max-w-2xl overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <ToggleSwitch
              label="Advanced Theme Controls"
              description={
                isAdvancedMode
                  ? "Editing the advanced sandbox — basic colours are preserved separately"
                  : "Editing basic macro colours — advanced palette is preserved separately"
              }
              checked={isAdvancedMode}
              onChange={(checked) => setThemeMode(checked ? "advanced" : "basic")}
            />

            <div
              className={cn(
                "mt-3 rounded-lg px-3 py-2 text-xs font-medium",
                isAdvancedMode
                  ? "bg-purple-50 text-purple-800"
                  : "bg-emerald-50 text-emerald-800"
              )}
            >
              Active layer: {isAdvancedMode ? "Advanced (granular)" : "Basic (auto-contrast)"}
            </div>

            {!isAdvancedMode ? (
              <div className="mt-6 space-y-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Basic Colors
                </h2>
                <StudioColorPicker
                  id="picker-headerNavBg"
                  label="Header & Navigation Background"
                  value={getColorValue("headerNavBg")}
                  fallback="#ffffff"
                  onChange={(v) => setColorValue("headerNavBg", v)}
                />
                <StudioColorPicker
                  id="picker-mainContentBg"
                  label="Main Content Background"
                  value={getColorValue("mainContentBackgroundColor")}
                  fallback="#fafafa"
                  onChange={(v) => setColorValue("mainContentBackgroundColor", v)}
                />
                <p className="text-xs text-gray-500">
                  Text and icons auto-adjust to black or white for readable contrast.
                </p>
                <DesignCategoryStylingSection />
              </div>
            ) : (
              <div className="mt-6 space-y-8">
                {ADVANCED_THEME_SECTIONS.map((section) => (
                  <div key={section.title}>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                      {section.title}
                    </h2>
                    <div className="space-y-2">
                      {section.fields.map((field) => (
                        <StudioColorPicker
                          key={field.id}
                          id={`picker-${field.id}`}
                          label={field.label}
                          value={getColorValue(field.id as ThemeColorFieldId)}
                          fallback="#ffffff"
                          onChange={(v) => setColorValue(field.id as ThemeColorFieldId, v)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
