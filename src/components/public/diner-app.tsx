"use client";

import { useState, useEffect } from "react";
import type { RestaurantFull, LanguageCode } from "@/lib/types";
import { detectBrowserLanguage } from "@/lib/utils";
import {
  loadDesign,
  DEFAULT_DESIGN,
  type RestaurantDesign,
} from "@/lib/restaurant-design";
import {
  loadRestaurantInfo,
  type RestaurantInfo,
} from "@/lib/restaurant-info";
import { RestaurantHeader } from "./restaurant-header";
import { MenuView } from "./menu-view";
import { ReservationView } from "./reservation-view";
import { BottomNavPill } from "./bottom-nav-pill";
import { RestaurantFooter } from "./restaurant-footer";

interface DinerAppProps {
  restaurant: RestaurantFull;
  previewMode?: boolean;
}

function buildDefaultInfo(restaurant: RestaurantFull): Partial<RestaurantInfo> {
  return {
    phone: restaurant.phone ?? "",
    contact_email: restaurant.contact_email ?? "",
    address: restaurant.address ?? "",
    instagram_url: restaurant.instagram_url ?? "",
    facebook_url: restaurant.facebook_url ?? "",
    website_url: restaurant.website_url ?? "",
    whatsapp_url: restaurant.whatsapp_url ?? "",
    operating_hours: restaurant.operating_hours.map((h) => ({
      day_of_week: h.day_of_week,
      open_time: h.open_time?.slice(0, 5) ?? "11:00",
      close_time: h.close_time?.slice(0, 5) ?? "22:00",
      is_closed: h.is_closed,
    })),
  };
}

export function DinerApp({ restaurant, previewMode = false }: DinerAppProps) {
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [activeView, setActiveView] = useState<"menu" | "reservation">("menu");
  const [design, setDesign] = useState<RestaurantDesign>(DEFAULT_DESIGN);
  const [info, setInfo] = useState<RestaurantInfo>(() =>
    loadRestaurantInfo(restaurant.id, buildDefaultInfo(restaurant))
  );

  const showReservation =
    restaurant.is_premium && restaurant.accepts_reservations;

  useEffect(() => {
    setLanguage(detectBrowserLanguage());
    setDesign(loadDesign(restaurant.id));
    setInfo(loadRestaurantInfo(restaurant.id, buildDefaultInfo(restaurant)));
  }, [restaurant.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const refresh = () => {
      setDesign(loadDesign(restaurant.id));
      setInfo(loadRestaurantInfo(restaurant.id, buildDefaultInfo(restaurant)));
    };
    window.addEventListener("storage", refresh);
    const interval = previewMode ? setInterval(refresh, 500) : undefined;
    return () => {
      window.removeEventListener("storage", refresh);
      if (interval) clearInterval(interval);
    };
  }, [restaurant.id, previewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="flex h-dvh flex-col overflow-hidden"
      style={{ backgroundColor: design.backgroundColor }}
    >
      <RestaurantHeader
        name={restaurant.name}
        logoUrl={restaurant.logo_url}
        instagramUrl={info.instagram_url || restaurant.instagram_url}
        facebookUrl={info.facebook_url || restaurant.facebook_url}
        websiteUrl={info.website_url || restaurant.website_url}
        customLinks={restaurant.custom_links}
        language={language}
        onLanguageChange={setLanguage}
        design={design}
      />

      <main className="flex min-h-0 flex-1 flex-col">
        {activeView === "menu" || !showReservation ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-20">
            <MenuView restaurant={restaurant} language={language} design={design} />
            <RestaurantFooter design={design} info={info} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pb-20">
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

