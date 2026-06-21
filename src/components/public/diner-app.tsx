"use client";

import { useState, useEffect } from "react";
import type { RestaurantFull, LanguageCode } from "@/lib/types";
import { detectBrowserLanguage } from "@/lib/utils";
import { RestaurantHeader } from "./restaurant-header";
import { MenuView } from "./menu-view";
import { DesignProvider, useDesign } from "@/contexts/design-context";

interface DinerAppProps {
  restaurant: RestaurantFull;
  previewMode?: boolean;
}

function DinerAppContent({ restaurant, previewMode }: DinerAppProps) {
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [footerNote, setFooterNote] = useState("");
  const { design } = useDesign();

  useEffect(() => {
    setLanguage(detectBrowserLanguage());
    // Load footer note from restaurant data
    if (restaurant.footer_slogan) {
      setFooterNote(restaurant.footer_slogan);
    }
  }, [restaurant.footer_slogan]);

  return (
    <div
      className="flex flex-col"
      style={{ backgroundColor: design.backgroundColor }}
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

      <main className="flex flex-1 flex-col pb-20">
        <MenuView restaurant={restaurant} language={language} design={design} />
      </main>

      {footerNote && (
        <footer className="shrink-0 border-t border-border/20 bg-white/50 px-4 py-3 text-center text-xs text-text-secondary backdrop-blur-sm">
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
