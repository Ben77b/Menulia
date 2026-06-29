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
import type { AdvancedTheme, ThemeHotspotId } from "@/lib/advanced-theme";
import {
  isBasicColorField,
  readBasicColor,
  writeBasicColorPatch,
  type ThemeColorFieldId,
} from "@/lib/theme-color-fields";
import {
  clearChildOverride,
  clearGroupChildOverrides,
  getEffectiveChildColor,
  getGroupParentColor,
  getHotspotGroup,
  groupsForBasicField,
  resolveUnifiedMenuTheme,
  setChildOverride,
  setGroupParentColor,
  splitAdvancedThemeStorage,
  type ThemeHotspotGroup,
} from "@/lib/theme-inheritance";
import { useRestaurant } from "./restaurant-context";
import { getSupabaseBrowserClient } from "@/lib/supabase";

interface DesignContextType {
  design: RestaurantDesign;
  advancedTheme: Partial<AdvancedTheme>;
  themeOverrides: Set<string>;
  resolvedTheme: ReturnType<typeof resolveUnifiedMenuTheme>;
  updateDesign: (updates: Partial<RestaurantDesign>) => void;
  updateAdvancedTheme: (updates: Partial<AdvancedTheme>) => void;
  getColorValue: (fieldId: ThemeColorFieldId) => string;
  setColorValue: (fieldId: ThemeColorFieldId, value: string) => void;
  getHotspotGroup: (hotspot: ThemeHotspotId) => ThemeHotspotGroup;
  getGroupParentColor: (hotspot: ThemeHotspotId) => string;
  setGroupParentColor: (hotspot: ThemeHotspotId, color: string) => void;
  getChildColor: (fieldId: keyof AdvancedTheme) => string;
  setChildColor: (fieldId: keyof AdvancedTheme, color: string) => void;
  isChildOverridden: (fieldId: keyof AdvancedTheme) => boolean;
  clearChildOverride: (fieldId: keyof AdvancedTheme) => void;
  setDesign: (design: RestaurantDesign) => void;
  setAdvancedTheme: (theme: Partial<AdvancedTheme>) => void;
  setThemeOverrides: (overrides: Set<string>) => void;
}

const DesignContext = createContext<DesignContextType | undefined>(undefined);

export function DesignProvider({ children }: { children: ReactNode }) {
  const [design, setDesignState] = useState<RestaurantDesign>(DEFAULT_DESIGN);
  const [advancedTheme, setAdvancedThemeState] = useState<Partial<AdvancedTheme>>({});
  const [themeOverrides, setThemeOverridesState] = useState<Set<string>>(new Set());
  const { currentRestaurant } = useRestaurant();

  useEffect(() => {
    const restaurantId = currentRestaurant?.id;
    if (!restaurantId) {
      setDesignState(DEFAULT_DESIGN);
      setAdvancedThemeState({});
      setThemeOverridesState(new Set());
      return;
    }

    async function loadDesignFromDatabase() {
      const supabase = getSupabaseBrowserClient();
      const fullSelect =
        "logo, meta_title, meta_description, theme_colors, typography, show_prices, show_descriptions, show_images, show_dietary, advanced_theme";

      let { data, error } = await supabase
        .from("restaurants")
        .select(fullSelect)
        .eq("id", restaurantId)
        .single();

      if (error && isMissingColumnError(error)) {
        const fallback = await supabase
          .from("restaurants")
          .select(
            "logo, meta_title, meta_description, theme_colors, typography, show_prices, show_descriptions, show_images, show_dietary"
          )
          .eq("id", restaurantId)
          .single();
        data = fallback.data as typeof data;
        error = fallback.error;
      }

      if (error) {
        console.error("Failed to load restaurant design:", error);
        return;
      }

      if (data) {
        try {
          setDesignState(designFromRestaurant(data));
          const { theme, overrides } = splitAdvancedThemeStorage(data.advanced_theme);
          setAdvancedThemeState(theme);
          setThemeOverridesState(overrides);
        } catch (loadError) {
          console.error("Failed to parse restaurant design:", loadError);
          setDesignState(DEFAULT_DESIGN);
          setAdvancedThemeState({});
          setThemeOverridesState(new Set());
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

  const basicColors = themeColorsFromDesign(design);

  const getColorValue = useCallback(
    (fieldId: ThemeColorFieldId): string => {
      if (isBasicColorField(fieldId)) {
        return readBasicColor(design, fieldId);
      }
      return getEffectiveChildColor(
        fieldId,
        basicColors,
        advancedTheme,
        themeOverrides
      );
    },
    [design, basicColors, advancedTheme, themeOverrides]
  );

  const applyBasicColorWithInheritance = useCallback(
    (fieldId: ThemeColorFieldId, value: string) => {
      if (!isBasicColorField(fieldId)) return;

      updateDesign(writeBasicColorPatch(fieldId, value));

      const affectedGroups = groupsForBasicField(fieldId);
      if (affectedGroups.length === 0) return;

      let nextAdvanced = { ...advancedTheme };
      let nextOverrides = new Set(themeOverrides);

      for (const group of affectedGroups) {
        const cleared = clearGroupChildOverrides(group, nextAdvanced, nextOverrides);
        nextAdvanced = cleared.advanced;
        nextOverrides = cleared.overrides;
      }

      setAdvancedThemeState(nextAdvanced);
      setThemeOverridesState(nextOverrides);
    },
    [advancedTheme, themeOverrides, updateDesign]
  );

  const setColorValue = useCallback(
    (fieldId: ThemeColorFieldId, value: string) => {
      if (isBasicColorField(fieldId)) {
        applyBasicColorWithInheritance(fieldId, value);
        return;
      }

      const result = setChildOverride(
        fieldId,
        value,
        advancedTheme,
        themeOverrides
      );
      setAdvancedThemeState(result.advanced);
      setThemeOverridesState(result.overrides);
    },
    [advancedTheme, themeOverrides, applyBasicColorWithInheritance]
  );

  const getHotspotGroupFn = useCallback((hotspot: ThemeHotspotId) => {
    return getHotspotGroup(hotspot);
  }, []);

  const getGroupParentColorFn = useCallback(
    (hotspot: ThemeHotspotId) => {
      return getGroupParentColor(getHotspotGroup(hotspot), design);
    },
    [design]
  );

  const setGroupParentColorFn = useCallback(
    (hotspot: ThemeHotspotId, color: string) => {
      const group = getHotspotGroup(hotspot);
      const result = setGroupParentColor(group, color, advancedTheme, themeOverrides);
      updateDesign(result.designPatch);
      setAdvancedThemeState(result.advanced);
      setThemeOverridesState(result.overrides);
    },
    [advancedTheme, themeOverrides, updateDesign]
  );

  const getChildColorFn = useCallback(
    (fieldId: keyof AdvancedTheme) => {
      return getEffectiveChildColor(fieldId, basicColors, advancedTheme, themeOverrides);
    },
    [basicColors, advancedTheme, themeOverrides]
  );

  const setChildColorFn = useCallback(
    (fieldId: keyof AdvancedTheme, color: string) => {
      const result = setChildOverride(fieldId, color, advancedTheme, themeOverrides);
      setAdvancedThemeState(result.advanced);
      setThemeOverridesState(result.overrides);
    },
    [advancedTheme, themeOverrides]
  );

  const isChildOverriddenFn = useCallback(
    (fieldId: keyof AdvancedTheme) => themeOverrides.has(fieldId),
    [themeOverrides]
  );

  const clearChildOverrideFn = useCallback(
    (fieldId: keyof AdvancedTheme) => {
      const result = clearChildOverride(fieldId, advancedTheme, themeOverrides);
      setAdvancedThemeState(result.advanced);
      setThemeOverridesState(result.overrides);
    },
    [advancedTheme, themeOverrides]
  );

  const setDesign = useCallback((newDesign: RestaurantDesign) => {
    setDesignState(newDesign);
  }, []);

  const setAdvancedTheme = useCallback((theme: Partial<AdvancedTheme>) => {
    setAdvancedThemeState(theme);
  }, []);

  const setThemeOverrides = useCallback((overrides: Set<string>) => {
    setThemeOverridesState(overrides);
  }, []);

  const resolvedTheme = resolveUnifiedMenuTheme(
    basicColors,
    advancedTheme,
    themeOverrides
  );

  return (
    <DesignContext.Provider
      value={{
        design,
        advancedTheme,
        themeOverrides,
        resolvedTheme,
        updateDesign,
        updateAdvancedTheme,
        getColorValue,
        setColorValue,
        getHotspotGroup: getHotspotGroupFn,
        getGroupParentColor: getGroupParentColorFn,
        setGroupParentColor: setGroupParentColorFn,
        getChildColor: getChildColorFn,
        setChildColor: setChildColorFn,
        isChildOverridden: isChildOverriddenFn,
        clearChildOverride: clearChildOverrideFn,
        setDesign,
        setAdvancedTheme,
        setThemeOverrides,
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
