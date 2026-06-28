"use client";

import { useState, useEffect, useMemo } from "react";
import type { RestaurantFull, LanguageCode } from "@/lib/types";
import type { RestaurantDesign } from "@/lib/restaurant-design";
import { detectBrowserLanguage } from "@/lib/utils";
import { RestaurantHeader } from "./restaurant-header";
import { MenuView } from "./menu-view";

interface DinerAppProps {
  restaurant: RestaurantFull;
  design: RestaurantDesign;
  previewMode?: boolean;
}

const FONT_CLASS_MAP: Record<string, { heading: string; body: string }> = {
  Inter: { heading: "font-[var(--font-inter)]", body: "font-[var(--font-inter)]" },
  Montserrat: { heading: "font-[var(--font-montserrat)]", body: "font-[var(--font-montserrat)]" },
  "Playfair Display": {
    heading: "font-[var(--font-playfair-display)]",
    body: "font-[var(--font-inter)]",
  },
  Poppins: { heading: "font-[var(--font-poppins)]", body: "font-[var(--font-poppins)]" },
  Roboto: { heading: "font-[var(--font-roboto)]", body: "font-[var(--font-roboto)]" },
  "Open Sans": { heading: "font-[var(--font-open-sans)]", body: "font-[var(--font-open-sans)]" },
  Lato: { heading: "font-[var(--font-lato)]", body: "font-[var(--font-lato)]" },
  Merriweather: {
    heading: "font-[var(--font-merriweather)]",
    body: "font-[var(--font-merriweather)]",
  },
  Oswald: { heading: "font-[var(--font-oswald)]", body: "font-[var(--font-inter)]" },
  Raleway: { heading: "font-[var(--font-raleway)]", body: "font-[var(--font-raleway)]" },
  "Source Sans Pro": {
    heading: "font-[var(--font-source-sans)]",
    body: "font-[var(--font-source-sans)]",
  },
  Ubuntu: { heading: "font-[var(--font-ubuntu)]", body: "font-[var(--font-ubuntu)]" },
};

export function DinerApp({ restaurant, design, previewMode = false }: DinerAppProps) {
  const [language, setLanguage] = useState<LanguageCode>("en");

  const fontClasses = useMemo(() => {
    const headingFont = design.titleFont || restaurant.font_pack_id || "Inter";
    const bodyFont = design.textFont || headingFont;
    const headingClasses = FONT_CLASS_MAP[headingFont] || FONT_CLASS_MAP.Inter;
    const bodyClasses = FONT_CLASS_MAP[bodyFont] || FONT_CLASS_MAP.Inter;
    return { heading: headingClasses.heading, body: bodyClasses.body };
  }, [design.titleFont, design.textFont, restaurant.font_pack_id]);

  useEffect(() => {
    if (!previewMode) {
      setLanguage(detectBrowserLanguage());
    }
  }, [previewMode]);

  return (
    <div
      className={`min-h-screen flex flex-col ${fontClasses.body}`}
      style={{ backgroundColor: design.mainContentBackgroundColor }}
    >
      <RestaurantHeader
        name={restaurant.name}
        logoUrl={design.logo || restaurant.logo}
        customLinks={restaurant.custom_links || []}
        language={language}
        onLanguageChange={setLanguage}
        design={design}
        restaurantId={restaurant.id}
      />

      <main className="flex flex-1 flex-col pt-24">
        <MenuView
          restaurant={restaurant}
          language={language}
          design={design}
          fontClasses={fontClasses}
        />
      </main>
    </div>
  );
}
