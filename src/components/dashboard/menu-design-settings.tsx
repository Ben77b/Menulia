"use client";

import { useState } from "react";
import { useRestaurant } from "@/contexts/restaurant-context";
import { supabase } from "@/lib/supabase";
import { DEFAULT_DESIGN } from "@/lib/restaurant-design";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";

const GOOGLE_FONTS = [
  "Inter",
  "Montserrat",
  "Playfair Display",
  "Poppins",
  "Roboto",
  "Open Sans",
  "Lato",
  "Merriweather",
  "Oswald",
  "Raleway",
  "Source Sans Pro",
  "Ubuntu",
];

interface MenuDesignSettingsProps {
  headerFooterBackgroundColor: string;
  categoryBackgroundColor: string;
  mainContentBackgroundColor: string;
  headerFooterFontColor: string;
  categoryFontColor: string;
  mainContentFontColor: string;
  titleFont: string;
  textFont: string;
  onChange: (updates: Partial<MenuDesignSettingsProps>) => void;
}

type ColorField =
  | "headerFooterBackgroundColor"
  | "categoryBackgroundColor"
  | "mainContentBackgroundColor"
  | "headerFooterFontColor"
  | "categoryFontColor"
  | "mainContentFontColor";

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer border-0 p-0"
          />
        </div>
        <span className="font-mono text-sm text-gray-600">{value}</span>
      </div>
    </div>
  );
}

export function MenuDesignSettings({
  headerFooterBackgroundColor,
  categoryBackgroundColor,
  mainContentBackgroundColor,
  headerFooterFontColor,
  categoryFontColor,
  mainContentFontColor,
  titleFont,
  textFont,
  onChange,
}: MenuDesignSettingsProps) {
  const { currentRestaurant } = useRestaurant();
  const [saving, setSaving] = useState(false);

  async function saveDesignSettings() {
    if (!currentRestaurant) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("restaurants")
        .update({
          theme_colors: {
            headerFooterBackgroundColor,
            categoryBackgroundColor,
            mainContentBackgroundColor,
            headerFooterFontColor,
            categoryFontColor,
            mainContentFontColor,
          },
          typography: { titleFont, textFont },
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentRestaurant.id);

      if (error) throw error;
      alert("Menu design saved!");
    } catch (error) {
      console.error("Error saving menu design:", error);
      alert("Failed to save menu design");
    } finally {
      setSaving(false);
    }
  }

  function updateColor(field: ColorField, value: string) {
    onChange({ [field]: value });
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <Palette className="h-5 w-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Menu Design</h2>
      </div>
      <p className="mb-6 text-sm text-gray-600">
        Colors and typography applied to your public menu page
      </p>

      <div className="space-y-8">
        <div>
          <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-500">
            Color Palette
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-5">
              <ColorPicker
                label="Header & Footer Background"
                value={headerFooterBackgroundColor}
                onChange={(v) => updateColor("headerFooterBackgroundColor", v)}
              />
              <ColorPicker
                label="Category Section Background"
                value={categoryBackgroundColor}
                onChange={(v) => updateColor("categoryBackgroundColor", v)}
              />
              <ColorPicker
                label="Main Dish Section Background"
                value={mainContentBackgroundColor}
                onChange={(v) => updateColor("mainContentBackgroundColor", v)}
              />
            </div>
            <div className="space-y-5">
              <ColorPicker
                label="Header/Footer Text Color"
                value={headerFooterFontColor}
                onChange={(v) => updateColor("headerFooterFontColor", v)}
              />
              <ColorPicker
                label="Category Text Color"
                value={categoryFontColor}
                onChange={(v) => updateColor("categoryFontColor", v)}
              />
              <ColorPicker
                label="Main Section Text Color"
                value={mainContentFontColor}
                onChange={(v) => updateColor("mainContentFontColor", v)}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-500">
            Typography
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Title Font</label>
              <select
                value={titleFont}
                onChange={(e) => onChange({ titleFont: e.target.value })}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {GOOGLE_FONTS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Body Font</label>
              <select
                value={textFont}
                onChange={(e) => onChange({ textFont: e.target.value })}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {GOOGLE_FONTS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <Button className="mt-6" onClick={saveDesignSettings} disabled={saving}>
        {saving ? "Saving..." : "Save Menu Design"}
      </Button>
    </div>
  );
}

export function defaultMenuDesignState() {
  return {
    headerFooterBackgroundColor: DEFAULT_DESIGN.headerFooterBackgroundColor,
    categoryBackgroundColor: DEFAULT_DESIGN.categoryBackgroundColor,
    mainContentBackgroundColor: DEFAULT_DESIGN.mainContentBackgroundColor,
    headerFooterFontColor: DEFAULT_DESIGN.headerFooterFontColor,
    categoryFontColor: DEFAULT_DESIGN.categoryFontColor,
    mainContentFontColor: DEFAULT_DESIGN.mainContentFontColor,
    titleFont: DEFAULT_DESIGN.titleFont,
    textFont: DEFAULT_DESIGN.textFont,
  };
}

export function menuDesignFromRestaurant(data: {
  theme_colors?: Record<string, string> | null;
  typography?: Record<string, string> | null;
}) {
  const defaults = defaultMenuDesignState();
  const theme = data.theme_colors ?? {};
  const typography = data.typography ?? {};

  return {
    headerFooterBackgroundColor:
      theme.headerFooterBackgroundColor ?? defaults.headerFooterBackgroundColor,
    categoryBackgroundColor:
      theme.categoryBackgroundColor ?? defaults.categoryBackgroundColor,
    mainContentBackgroundColor:
      theme.mainContentBackgroundColor ?? defaults.mainContentBackgroundColor,
    headerFooterFontColor: theme.headerFooterFontColor ?? defaults.headerFooterFontColor,
    categoryFontColor: theme.categoryFontColor ?? defaults.categoryFontColor,
    mainContentFontColor: theme.mainContentFontColor ?? defaults.mainContentFontColor,
    titleFont: typography.titleFont ?? defaults.titleFont,
    textFont: typography.textFont ?? typography.titleFont ?? defaults.textFont,
  };
}
