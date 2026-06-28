"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDesign } from "@/contexts/design-context";
import { useRestaurant } from "@/contexts/restaurant-context";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/auth/errors";
import { themeColorsFromDesign } from "@/lib/restaurant-design";
import { normalizeHexColor, serializeMenuThemeColors } from "@/lib/theme-colors";
import { serializeDisplayOptions } from "@/lib/display-options";
import {
  ADVANCED_THEME_SECTIONS,
  HOTSPOT_PRIMARY_PICKER,
  resolveMenuTheme,
  serializeAdvancedTheme,
  type AdvancedTheme,
  type ThemeHotspotId,
} from "@/lib/advanced-theme";
import { isMissingColumnError } from "@/lib/restaurant-settings";
import { fetchPublicMenuData } from "@/lib/public-menu-fetch";
import { Button } from "@/components/ui/button";
import { ToggleSwitch } from "@/components/dashboard/toggle-switch";
import { PublicMenuLayout } from "@/components/public/public-menu-layout";
import { cn } from "@/lib/utils";
import type { PublicMenuParentCategory, PublicMenuSubcategory } from "@/lib/menu-hierarchy";

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

function StudioColorPicker({
  id,
  label,
  value,
  fallback,
  highlighted,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  fallback: string;
  highlighted?: boolean;
  onChange: (value: string) => void;
}) {
  const safeValue = normalizeHexColor(value, fallback);

  return (
    <div
      id={id}
      className={cn(
        "scroll-mt-24 rounded-lg p-3 transition-colors",
        highlighted && "bg-indigo-50 ring-2 ring-indigo-400"
      )}
    >
      <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
          <input
            type="color"
            value={safeValue}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer border-0 p-0"
          />
        </div>
        <span className="font-mono text-xs text-gray-600">{safeValue}</span>
      </div>
    </div>
  );
}

export function DesignStudio() {
  const { design, advancedTheme, updateDesign, updateAdvancedTheme } = useDesign();
  const { currentRestaurant, refreshRestaurants } = useRestaurant();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const [advancedMode, setAdvancedMode] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<ThemeHotspotId | null>(null);
  const [highlightedPicker, setHighlightedPicker] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [menu, setMenu] = useState<PublicMenuParentCategory[]>([]);
  const [flatCategories, setFlatCategories] = useState<PublicMenuSubcategory[]>(MOCK_FLAT);
  const [hasNestedStructure, setHasNestedStructure] = useState(false);

  const supabase = getSupabaseBrowserClient();

  const basicTheme = useMemo(() => themeColorsFromDesign(design), [design]);
  const resolvedTheme = useMemo(
    () => resolveMenuTheme(basicTheme, advancedTheme),
    [basicTheme, advancedTheme]
  );

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

  const getPickerValue = useCallback(
    (fieldId: keyof AdvancedTheme | "headerNavBg" | "mainContentBg"): string => {
      if (fieldId === "headerNavBg") {
        return design.headerBackgroundColor;
      }
      if (fieldId === "mainContentBg") {
        return design.mainContentBackgroundColor;
      }
      const key = fieldId as keyof AdvancedTheme;
      if (advancedTheme[key]) {
        return advancedTheme[key] as string;
      }
      const resolvedKey = fieldId as keyof typeof resolvedTheme;
      if (resolvedKey in resolvedTheme) {
        return String(resolvedTheme[resolvedKey as keyof typeof resolvedTheme]);
      }
      return "#ffffff";
    },
    [design, advancedTheme, resolvedTheme]
  );

  const setPickerValue = useCallback(
    (fieldId: keyof AdvancedTheme | "headerNavBg" | "mainContentBg", value: string) => {
      if (fieldId === "headerNavBg") {
        updateDesign({ headerBackgroundColor: value, footerBackgroundColor: value });
        return;
      }
      if (fieldId === "mainContentBg") {
        updateDesign({ mainContentBackgroundColor: value });
        return;
      }
      updateAdvancedTheme({ [fieldId]: value });
    },
    [updateDesign, updateAdvancedTheme]
  );

  const handleHotspotClick = useCallback((hotspot: ThemeHotspotId) => {
    setActiveHotspot(hotspot);
    const pickerId = HOTSPOT_PRIMARY_PICKER[hotspot];
    const elementId = `picker-${pickerId}`;

    if (!advancedMode) {
      setAdvancedMode(true);
      setTimeout(() => {
        document.getElementById(elementId)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    } else {
      document.getElementById(elementId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    setHighlightedPicker(elementId);
    setTimeout(() => {
      setHighlightedPicker(null);
      setActiveHotspot(null);
    }, 2000);
  }, [advancedMode]);

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
        typography: {
          titleFont: design.titleFont,
          textFont: design.textFont,
        },
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

      let { error } = await supabase
        .from("restaurants")
        .update(basePayload)
        .eq("id", currentRestaurant.id);

      if (error && isMissingColumnError(error)) {
        const withoutAdvanced = { ...basePayload };
        delete (withoutAdvanced as { advanced_theme?: unknown }).advanced_theme;
        const retry = await supabase
          .from("restaurants")
          .update(withoutAdvanced)
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
          "Colors saved. Run supabase/migrations/20250701000000_advanced_theme.sql in Supabase to persist advanced overrides."
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

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Design Studio</h1>
          <p className="mt-1 text-sm text-gray-600">
            Click areas in the live preview to jump to their color controls
          </p>
        </div>
        <Button size="lg" className="px-8" onClick={handleSaveDesign} disabled={saving || !currentRestaurant?.id}>
          {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save Design"}
        </Button>
      </div>

      {saveError && (
        <div className="mb-4 shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {saveError}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row">
        {/* Left — controls sidebar */}
        <div
          ref={sidebarRef}
          className="w-full shrink-0 overflow-y-auto rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:w-[380px] lg:max-w-[40%]"
        >
          <ToggleSwitch
            label="Advanced Theme Controls"
            description="Unlock granular color pickers for every menu section"
            checked={advancedMode}
            onChange={setAdvancedMode}
          />

          {!advancedMode ? (
            <div className="mt-6 space-y-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Basic Colors</h2>
              <StudioColorPicker
                id="picker-headerNavBg"
                label="Header & Navigation Background"
                value={design.headerBackgroundColor}
                fallback="#ffffff"
                highlighted={highlightedPicker === "picker-headerNavBg"}
                onChange={(v) => updateDesign({ headerBackgroundColor: v, footerBackgroundColor: v })}
              />
              <StudioColorPicker
                id="picker-mainContentBg"
                label="Main Content Background"
                value={design.mainContentBackgroundColor}
                fallback="#fafafa"
                highlighted={highlightedPicker === "picker-mainContentBg"}
                onChange={(v) => updateDesign({ mainContentBackgroundColor: v })}
              />
              <p className="text-xs text-gray-500">
                Text and icons auto-adjust to black or white for readable contrast.
              </p>
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
                        value={getPickerValue(field.id)}
                        fallback="#ffffff"
                        highlighted={highlightedPicker === `picker-${field.id}`}
                        onChange={(v) => setPickerValue(field.id, v)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 border-t border-gray-100 pt-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Display Options</h2>
            <ToggleSwitch
              label="Show Prices"
              checked={design.showPrices ?? true}
              onChange={(checked) => updateDesign({ showPrices: checked })}
            />
            <ToggleSwitch
              label="Show Descriptions"
              checked={design.showDescriptions ?? true}
              onChange={(checked) => updateDesign({ showDescriptions: checked })}
            />
            <ToggleSwitch
              label="Show Images"
              checked={design.showImages ?? true}
              onChange={(checked) => updateDesign({ showImages: checked })}
            />
            <ToggleSwitch
              label="Show Dietary Info"
              checked={design.showDietary ?? true}
              onChange={(checked) => updateDesign({ showDietary: checked })}
            />
          </div>
        </div>

        {/* Right — live preview canvas */}
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-inner">
          <div className="border-b border-gray-200 bg-white px-4 py-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            Live Preview — click any section to edit
          </div>
          <div className="h-full overflow-auto p-4">
            <div
              className="mx-auto origin-top overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-lg"
              style={{ transform: "scale(0.72)", transformOrigin: "top center", width: "138%", marginLeft: "-19%" }}
            >
              <PublicMenuLayout
                restaurantName={currentRestaurant?.name ?? "Your Restaurant"}
                logo={design.logo || null}
                location={design.location || "123 Main Street"}
                hours={"Mon–Fri: 11:00 – 22:00\nSat–Sun: 10:00 – 23:00"}
                contactInfo={design.contactInfo || "+1 555 0100 | hello@restaurant.com"}
                footerSlogan="Fresh ingredients, crafted with care."
                theme={resolvedTheme}
                titleFont={design.titleFont}
                bodyFont={design.textFont}
                menu={menu}
                flatCategories={flatCategories}
                hasNestedStructure={hasNestedStructure}
                links={[]}
                display={displayOptions}
                previewInteractive={{
                  enabled: true,
                  activeHotspot,
                  onHotspotClick: handleHotspotClick,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
