"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import {
  DEFAULT_DESIGN,
  designFromRestaurant,
  applyComputedContrast,
  themeColorsFromDesign,
  type RestaurantDesign,
} from "@/lib/restaurant-design";
import { isMissingColumnError } from "@/lib/restaurant-settings";
import {
  getAdvancedFieldDefault,
  parseAdvancedTheme,
  resolveMenuThemeForMode,
  type AdvancedTheme,
} from "@/lib/advanced-theme";
import {
  hotspotFieldForMode,
  readThemeColorValue,
  writeThemeColorPatch,
  type ThemeColorFieldId,
} from "@/lib/theme-color-fields";
import { DEFAULT_THEME_MODE, parseThemeMode, type ThemeMode } from "@/lib/theme-mode";
import type { ThemeHotspotId } from "@/lib/advanced-theme";
import { useRestaurant } from "./restaurant-context";
import { getSupabaseBrowserClient } from "@/lib/supabase";

interface DesignContextType {
  design: RestaurantDesign;
  advancedTheme: Partial<AdvancedTheme>;
  themeMode: ThemeMode;
  resolvedTheme: ReturnType<typeof resolveMenuThemeForMode>;
  updateDesign: (updates: Partial<RestaurantDesign>) => void;
  updateAdvancedTheme: (updates: Partial<AdvancedTheme>) => void;
  setThemeMode: (mode: ThemeMode) => void;
  getColorValue: (fieldId: ThemeColorFieldId) => string;
  setColorValue: (fieldId: ThemeColorFieldId, value: string) => void;
  getHotspotColor: (hotspot: ThemeHotspotId) => string;
  setHotspotColor: (hotspot: ThemeHotspotId, value: string) => void;
  setDesign: (design: RestaurantDesign) => void;
  setAdvancedTheme: (theme: Partial<AdvancedTheme>) => void;
}

const DesignContext = createContext<DesignContextType | undefined>(undefined);

export function DesignProvider({ children }: { children: ReactNode }) {
  const [design, setDesignState] = useState<RestaurantDesign>(DEFAULT_DESIGN);
  const [advancedTheme, setAdvancedThemeState] = useState<Partial<AdvancedTheme>>({});
  const [themeMode, setThemeModeState] = useState<ThemeMode>(DEFAULT_THEME_MODE);
  const { currentRestaurant } = useRestaurant();

  useEffect(() => {
    const restaurantId = currentRestaurant?.id;
    if (!restaurantId) {
      setDesignState(DEFAULT_DESIGN);
      setAdvancedThemeState({});
      setThemeModeState(DEFAULT_THEME_MODE);
      return;
    }

    async function loadDesignFromDatabase() {
      const supabase = getSupabaseBrowserClient();
      const fullSelect =
        "logo, meta_title, meta_description, theme_colors, typography, show_prices, show_descriptions, show_images, show_dietary, advanced_theme, theme_mode";

      let { data, error } = await supabase
        .from("restaurants")
        .select(fullSelect)
        .eq("id", restaurantId)
        .single();

      if (error && isMissingColumnError(error)) {
        const fallback = await supabase
          .from("restaurants")
          .select(
            "logo, meta_title, meta_description, theme_colors, typography, show_prices, show_descriptions, show_images, show_dietary, advanced_theme"
          )
          .eq("id", restaurantId)
          .single();
        data = fallback.data;
        error = fallback.error;
      }

      if (error) {
        console.error("Failed to load restaurant design:", error);
        return;
      }

      if (data) {
        try {
          setDesignState(designFromRestaurant(data));
          setAdvancedThemeState(parseAdvancedTheme(data.advanced_theme));
          setThemeModeState(parseThemeMode(data.theme_mode));
        } catch (loadError) {
          console.error("Failed to parse restaurant design:", loadError);
          setDesignState(DEFAULT_DESIGN);
          setAdvancedThemeState({});
          setThemeModeState(DEFAULT_THEME_MODE);
        }
      }
    }

    loadDesignFromDatabase();
  }, [currentRestaurant?.id]);

  const updateDesign = useCallback((updates: Partial<RestaurantDesign>) => {
    setDesignState((prev) => applyComputedContrast({ ...prev, ...updates }));
  }, []);

  const updateAdvancedTheme = useCallback((updates: Partial<AdvancedTheme>) => {
    setAdvancedThemeState((prev) => ({ ...prev, ...updates }));
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
  }, []);

  const getColorValue = useCallback(
    (fieldId: ThemeColorFieldId): string => {
      return readThemeColorValue(
        themeMode,
        design,
        advancedTheme,
        fieldId,
        getAdvancedFieldDefault
      );
    },
    [themeMode, design, advancedTheme]
  );

  const setColorValue = useCallback(
    (fieldId: ThemeColorFieldId, value: string) => {
      const patch = writeThemeColorPatch(themeMode, fieldId, value);
      if (patch.design) {
        updateDesign(patch.design);
      }
      if (patch.advanced) {
        updateAdvancedTheme(patch.advanced);
      }
    },
    [themeMode, updateDesign, updateAdvancedTheme]
  );

  const getHotspotColor = useCallback(
    (hotspot: ThemeHotspotId) => {
      const fieldId = hotspotFieldForMode(hotspot, themeMode);
      return getColorValue(fieldId);
    },
    [themeMode, getColorValue]
  );

  const setHotspotColor = useCallback(
    (hotspot: ThemeHotspotId, value: string) => {
      const fieldId = hotspotFieldForMode(hotspot, themeMode);
      setColorValue(fieldId, value);
    },
    [themeMode, setColorValue]
  );

  const setDesign = useCallback((newDesign: RestaurantDesign) => {
    setDesignState(newDesign);
  }, []);

  const setAdvancedTheme = useCallback((theme: Partial<AdvancedTheme>) => {
    setAdvancedThemeState(theme);
  }, []);

  const resolvedTheme = resolveMenuThemeForMode(
    themeMode,
    themeColorsFromDesign(design),
    advancedTheme
  );

  return (
    <DesignContext.Provider
      value={{
        design,
        advancedTheme,
        themeMode,
        resolvedTheme,
        updateDesign,
        updateAdvancedTheme,
        setThemeMode,
        getColorValue,
        setColorValue,
        getHotspotColor,
        setHotspotColor,
        setDesign,
        setAdvancedTheme,
      }}
    >
      {children}
    </DesignContext.Provider>
  );
}

export function useDesign() {
  const context = useContext(DesignContext);
  if (context === undefined) {
    throw new Error("useDesign must be used within a DesignProvider");
  }
  return context;
}

export { themeColorsFromDesign };
