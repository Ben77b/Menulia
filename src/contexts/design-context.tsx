"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { DEFAULT_DESIGN, designFromRestaurant, type RestaurantDesign } from "@/lib/restaurant-design";
import { useRestaurant } from "./restaurant-context";
import { getSupabaseBrowserClient } from "@/lib/supabase";

interface DesignContextType {
  design: RestaurantDesign;
  updateDesign: (updates: Partial<RestaurantDesign>) => void;
  setDesign: (design: RestaurantDesign) => void;
}

const DesignContext = createContext<DesignContextType | undefined>(undefined);

export function DesignProvider({ children }: { children: ReactNode }) {
  const [design, setDesignState] = useState<RestaurantDesign>(DEFAULT_DESIGN);
  const { currentRestaurant } = useRestaurant();

  useEffect(() => {
    if (!currentRestaurant?.id) {
      setDesignState(DEFAULT_DESIGN);
      return;
    }

    async function loadDesignFromDatabase() {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("restaurants")
        .select("name, logo, theme_colors, typography")
        .eq("id", currentRestaurant.id)
        .single();

      if (error) {
        console.error("Failed to load restaurant design:", error);
        return;
      }

      if (data) {
        setDesignState(designFromRestaurant(data));
      }
    }

    loadDesignFromDatabase();
  }, [currentRestaurant?.id]);

  const updateDesign = (updates: Partial<RestaurantDesign>) => {
    setDesignState((prev) => ({ ...prev, ...updates }));
  };

  const setDesign = (newDesign: RestaurantDesign) => {
    setDesignState(newDesign);
  };

  return (
    <DesignContext.Provider value={{ design, updateDesign, setDesign }}>
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
