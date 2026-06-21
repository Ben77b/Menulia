"use client";

import { useState, useEffect, useMemo } from "react";
import type { RestaurantFull, LanguageCode } from "@/lib/types";
import { detectBrowserLanguage } from "@/lib/utils";
import { RestaurantHeader } from "./restaurant-header";
import { MenuView } from "./menu-view";
import { DesignProvider, useDesign } from "@/contexts/design-context";

interface DinerAppProps {
  restaurant: RestaurantFull;
  previewMode?: boolean;
}

const FONT_CLASS_MAP: Record<string, { heading: string; body: string }> = {
  "Inter": { heading: "font-[var(--font-inter)]", body: "font-[var(--font-inter)]" },
  "Montserrat": { heading: "font-[var(--font-montserrat)]", body: "font-[var(--font-montserrat)]" },
  "Playfair Display": { heading: "font-[var(--font-playfair-display)]", body: "font-[var(--font-inter)]" },
  "Poppins": { heading: "font-[var(--font-poppins)]", body: "font-[var(--font-poppins)]" },
  "Roboto": { heading: "font-[var(--font-roboto)]", body: "font-[var(--font-roboto)]" },
  "Open Sans": { heading: "font-[var(--font-open-sans)]", body: "font-[var(--font-open-sans)]" },
  "Lato": { heading: "font-[var(--font-lato)]", body: "font-[var(--font-lato)]" },
  "Merriweather": { heading: "font-[var(--font-merriweather)]", body: "font-[var(--font-merriweather)]" },
  "Oswald": { heading: "font-[var(--font-oswald)]", body: "font-[var(--font-inter)]" },
  "Raleway": { heading: "font-[var(--font-raleway)]", body: "font-[var(--font-raleway)]" },
  "Source Sans Pro": { heading: "font-[var(--font-source-sans)]", body: "font-[var(--font-source-sans)]" },
  "Ubuntu": { heading: "font-[var(--font-ubuntu)]", body: "font-[var(--font-ubuntu)]" },
};

function DinerAppContent({ restaurant, previewMode }: DinerAppProps) {
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [footerNote, setFooterNote] = useState("");
  const { design } = useDesign();

  const fontClasses = useMemo(() => {
    const fontPackId = restaurant.font_pack_id || "Inter";
    return FONT_CLASS_MAP[fontPackId] || FONT_CLASS_MAP["Inter"];
  }, [restaurant.font_pack_id]);

  useEffect(() => {
    setLanguage(detectBrowserLanguage());
    // Load footer note from restaurant data
    if (restaurant.footer_slogan) {
      setFooterNote(restaurant.footer_slogan);
    }
  }, [restaurant.footer_slogan]);

  return (
    <div
      className={`flex flex-col ${fontClasses.body}`}
      style={{ backgroundColor: design.headerFooterBackgroundColor }}
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

      <main className="flex flex-1 flex-col pb-20" style={{ backgroundColor: design.mainContentBackgroundColor }}>
        <MenuView restaurant={restaurant} language={language} design={design} fontClasses={fontClasses} />
      </main>

      {footerNote && (
        <footer className="shrink-0 border-t border-border/20 px-4 py-3 text-center text-xs backdrop-blur-sm" style={{ backgroundColor: design.headerFooterBackgroundColor, color: design.headerFooterFontColor }}>
          {footerNote}
        </footer>
      )}
    </div>
  );
}

export function DinerApp({ restaurant, previewMode = false }: DinerAppProps) {
  return (
    <DesignProvider>
      <DinerAppContent restaurant={restaurant} previewMode={previewMode} />
    </DesignProvider>
  );
}
