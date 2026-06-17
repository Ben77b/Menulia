"use client";

import { useState, useEffect } from "react";
import type { RestaurantFull, LanguageCode } from "@/lib/types";
import { detectBrowserLanguage } from "@/lib/utils";
import { RestaurantHeader } from "./restaurant-header";
import { MenuView } from "./menu-view";
import { ReservationView } from "./reservation-view";
import { BottomNavPill } from "./bottom-nav-pill";
import { DesignProvider, useDesign } from "@/contexts/design-context";

interface DinerAppProps {
  restaurant: RestaurantFull;
  previewMode?: boolean;
}

function DinerAppContent({ restaurant, previewMode }: DinerAppProps) {
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [activeView, setActiveView] = useState<"menu" | "reservation">("menu");
  const [footerNote, setFooterNote] = useState("");
  const { design } = useDesign();

  const showReservation =
    restaurant.is_premium && restaurant.accepts_reservations;

  useEffect(() => {
    setLanguage(detectBrowserLanguage());
    // Load footer note from localStorage
    const savedFooter = localStorage.getItem(`footer-note-${restaurant.id}`);
    if (savedFooter) setFooterNote(savedFooter);
  }, [restaurant.id]);

  return (
    <div
      className="flex flex-col"
      style={{ backgroundColor: design.backgroundColor }}
    >
      <RestaurantHeader
        name={restaurant.name}
        logoUrl={design.logo || restaurant.logo_url}
        instagramUrl={restaurant.instagram_url}
        facebookUrl={restaurant.facebook_url}
        websiteUrl={restaurant.website_url}
        customLinks={restaurant.custom_links}
        language={language}
        onLanguageChange={setLanguage}
        design={design}
        restaurantId={restaurant.id}
      />

      <main className="flex flex-1 flex-col pb-20">
        {activeView === "menu" || !showReservation ? (
          <MenuView restaurant={restaurant} language={language} design={design} />
        ) : (
          <div className="flex-1 overflow-y-auto">
            <ReservationView
              restaurantName={restaurant.name}
              operatingHours={restaurant.operating_hours}
            />
          </div>
        )}
      </main>

      {footerNote && (
        <footer className="shrink-0 border-t border-border/20 bg-white/50 px-4 py-3 text-center text-xs text-text-secondary backdrop-blur-sm">
          {footerNote}
        </footer>
      )}

      <BottomNavPill
        activeView={activeView}
        onViewChange={setActiveView}
        showReservation={showReservation}
        accentColor={design.accentColor}
      />
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
