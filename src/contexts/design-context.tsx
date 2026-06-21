"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { DEFAULT_DESIGN, type RestaurantDesign } from "@/lib/restaurant-design";
import { useRestaurant } from "./restaurant-context";

interface DesignContextType {
  design: RestaurantDesign;
  updateDesign: (updates: Partial<RestaurantDesign>) => void;
  setDesign: (design: RestaurantDesign) => void;
}

const DesignContext = createContext<DesignContextType | undefined>(undefined);

const STORAGE_KEY = "menulia_current_design";

export function DesignProvider({ children }: { children: ReactNode }) {
  const [design, setDesignState] = useState<RestaurantDesign>(DEFAULT_DESIGN);
  const { currentRestaurant } = useRestaurant();

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDesignState({ ...DEFAULT_DESIGN, ...parsed });
      } catch (e) {
        console.error("Failed to parse saved design:", e);
      }
    }
  }, []);

  // Load font_pack_id from restaurant data
  useEffect(() => {
    if (currentRestaurant?.font_pack_id) {
      const fontMap: Record<string, string> = {
        "Inter": "Inter",
        "Montserrat": "Montserrat",
        "Playfair Display": "Playfair Display",
        "Poppins": "Poppins",
        "Roboto": "Roboto",
        "Open Sans": "Open Sans",
        "Lato": "Lato",
        "Merriweather": "Merriweather",
        "Oswald": "Oswald",
        "Raleway": "Raleway",
        "Source Sans Pro": "Source Sans Pro",
        "Ubuntu": "Ubuntu",
      };
      const font = fontMap[currentRestaurant.font_pack_id] || "Inter";
      updateDesign({ titleFont: font, textFont: font });
    }
  }, [currentRestaurant?.font_pack_id]);

  // Listen for storage changes (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setDesignState({ ...DEFAULT_DESIGN, ...parsed });
        } catch (e) {
          console.error("Failed to parse storage change:", e);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const updateDesign = (updates: Partial<RestaurantDesign>) => {
    const newDesign = { ...design, ...updates };
    setDesignState(newDesign);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newDesign));
  };

  const setDesign = (newDesign: RestaurantDesign) => {
    setDesignState(newDesign);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newDesign));
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
