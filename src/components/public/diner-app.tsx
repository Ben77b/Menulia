"use client";

import { useState, useEffect } from "react";
import type { RestaurantFull, LanguageCode } from "@/lib/types";
import { detectBrowserLanguage } from "@/lib/utils";
import {
  loadDesign,
  DEFAULT_DESIGN,
  type RestaurantDesign,
} from "@/lib/restaurant-design";
import { RestaurantHeader } from "./restaurant-header";
import { MenuView } from "./menu-view";
import { ReservationView } from "./reservation-view";
import { BottomNavPill } from "./bottom-nav-pill";

interface DinerAppProps {
  restaurant: RestaurantFull;
  previewMode?: boolean;
}

export function DinerApp({ restaurant, previewMode = false }: DinerAppProps) {
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [activeView, setActiveView] = useState<"menu" | "reservation">("menu");
  const [design, setDesign] = useState<RestaurantDesign>(DEFAULT_DESIGN);

  const showReservation =
    restaurant.is_premium && restaurant.accepts_reservations;

  useEffect(() => {
    setLanguage(detectBrowserLanguage());
    setDesign(loadDesign(restaurant.id));
  }, [restaurant.id]);

  useEffect(() => {
    const onStorage = () => setDesign(loadDesign(restaurant.id));
    window.addEventListener("storage", onStorage);
    const interval = previewMode
      ? setInterval(() => setDesign(loadDesign(restaurant.id)), 500)
      : undefined;
    return () => {
      window.removeEventListener("storage", onStorage);
      if (interval) clearInterval(interval);
    };
  }, [restaurant.id, previewMode]);

  return (
    <div
      className="flex h-dvh flex-col overflow-hidden"
      style={{ backgroundColor: design.backgroundColor }}
    >
      <RestaurantHeader
        name={restaurant.name}
        logoUrl={restaurant.logo_url}
        instagramUrl={restaurant.instagram_url}
        facebookUrl={restaurant.facebook_url}
        websiteUrl={restaurant.website_url}
        customLinks={restaurant.custom_links}
        language={language}
        onLanguageChange={setLanguage}
        design={design}
      />

      <main className="flex min-h-0 flex-1 flex-col pb-20">
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

      <BottomNavPill
        activeView={activeView}
        onViewChange={setActiveView}
        showReservation={showReservation}
        accentColor={design.accentColor}
      />
    </div>
  );
}
