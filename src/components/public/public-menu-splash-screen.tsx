"use client";

import { UtensilsCrossed } from "lucide-react";
import { RestaurantLogo } from "@/components/restaurant-logo";
import { usePublicMenuSplash } from "@/components/public/public-menu-route-shell";
import { cn } from "@/lib/utils";

export function PublicMenuSplashScreen() {
  const splash = usePublicMenuSplash();

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ backgroundColor: splash.backgroundColor }}
      aria-busy="true"
      aria-label="Loading menu"
    >
      <div className="flex w-full max-w-xs flex-col items-center gap-8">
        {splash.logo ? (
          <RestaurantLogo
            src={splash.logo}
            alt={splash.restaurantName ? `${splash.restaurantName} logo` : "Restaurant logo"}
            wrapperClassName="h-24 w-48"
            className="h-24 w-auto"
          />
        ) : (
          <div
            className="flex h-24 w-24 items-center justify-center rounded-3xl border border-black/5 bg-white/70 shadow-sm backdrop-blur-sm"
            style={{ color: splash.accentColor }}
          >
            <UtensilsCrossed className="h-10 w-10" strokeWidth={1.5} aria-hidden />
          </div>
        )}

        <div className="flex items-center gap-2" aria-hidden>
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className={cn("public-menu-splash-dot h-2.5 w-2.5 rounded-full")}
              style={{
                backgroundColor: splash.accentColor,
                animationDelay: `${index * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
