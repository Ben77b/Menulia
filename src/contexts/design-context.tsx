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
import { parseAdvancedTheme, type AdvancedTheme } from "@/lib/advanced-theme";
import { useRestaurant } from "./restaurant-context";
import { getSupabaseBrowserClient } from "@/lib/supabase";

interface DesignContextType {
  design: RestaurantDesign;
  advancedTheme: Partial<AdvancedTheme>;
  updateDesign: (updates: Partial<RestaurantDesign>) => void;
  updateAdvancedTheme: (updates: Partial<AdvancedTheme>) => void;
  setDesign: (design: RestaurantDesign) => void;
  setAdvancedTheme: (theme: Partial<AdvancedTheme>) => void;
}

const DesignContext = createContext<DesignContextType | undefined>(undefined);

export function DesignProvider({ children }: { children: ReactNode }) {
  const [design, setDesignState] = useState<RestaurantDesign>(DEFAULT_DESIGN);
  const [advancedTheme, setAdvancedThemeState] = useState<Partial<AdvancedTheme>>({});
  const { currentRestaurant } = useRestaurant();

  useEffect(() => {
    const restaurantId = currentRestaurant?.id;
    if (!restaurantId) {
      setDesignState(DEFAULT_DESIGN);
      setAdvancedThemeState({});
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
          .select("logo, meta_title, meta_description, theme_colors, typography")
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
        } catch (loadError) {
          console.error("Failed to parse restaurant design:", loadError);
          setDesignState(DEFAULT_DESIGN);
          setAdvancedThemeState({});
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

  const setDesign = useCallback((newDesign: RestaurantDesign) => {
    setDesignState(newDesign);
  }, []);

  const setAdvancedTheme = useCallback((theme: Partial<AdvancedTheme>) => {
    setAdvancedThemeState(theme);
  }, []);

  return (
    <DesignContext.Provider
      value={{
        design,
        advancedTheme,
        updateDesign,
        updateAdvancedTheme,
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
