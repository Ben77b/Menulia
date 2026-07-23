"use client";

import { UtensilsCrossed } from "lucide-react";
import { RestaurantLogo } from "@/components/restaurant-logo";
import { usePublicMenuSplash } from "@/components/public/public-menu-route-shell";
import {
  DEFAULT_PUBLIC_MENU_SPLASH,
} from "@/lib/public-menu-cache";
import { cn } from "@/lib/utils";

/**
 * Instant branded public-menu splash — logo + 3-dot pulse on the owner's canvas color.
 * Used by `loading.tsx` and stays viewport-locked to avoid CLS flicker into the menu.
 */
export function PublicMenuSplashScreen() {
  const splash = usePublicMenuSplash();
  const backgroundColor =
    splash?.backgroundColor || DEFAULT_PUBLIC_MENU_SPLASH.backgroundColor;
  const accentColor = splash?.accentColor || DEFAULT_PUBLIC_MENU_SPLASH.accentColor;
  const logo = splash?.logo ?? null;
  const restaurantName = splash?.restaurantName || "";

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-screen w-full flex-col items-center justify-center px-6"
      style={{
        backgroundColor,
        // Keep shell/page colors aligned for a seamless handoff.
        ["--public-menu-bg" as string]: backgroundColor,
        ["--public-menu-accent" as string]: accentColor,
      }}
      aria-busy="true"
      aria-live="polite"
      aria-label={restaurantName ? `Loading ${restaurantName} menu` : "Loading menu"}
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        {logo ? (
          <RestaurantLogo
            src={logo}
            alt={restaurantName ? `${restaurantName} logo` : "Restaurant logo"}
            wrapperClassName="flex h-28 w-full max-w-[min(80vw,14rem)] items-center justify-center sm:h-32 sm:max-w-[16rem]"
            className="max-h-28 w-auto max-w-full object-contain sm:max-h-32"
            priority
          />
        ) : restaurantName ? (
          <p
            className="max-w-[min(80vw,16rem)] text-center text-xl font-semibold uppercase tracking-[0.2em] sm:text-2xl"
            style={{ color: accentColor }}
          >
            {restaurantName}
          </p>
        ) : (
          <div
            className="flex h-24 w-24 items-center justify-center rounded-3xl border border-black/5 bg-white/70 shadow-sm backdrop-blur-sm"
            style={{ color: accentColor }}
          >
            <UtensilsCrossed className="h-10 w-10" strokeWidth={1.5} aria-hidden />
          </div>
        )}

        <div className="flex items-center gap-2.5" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className={cn("public-menu-splash-dot h-2.5 w-2.5 rounded-full")}
              style={{
                backgroundColor: accentColor,
                animationDelay: `${index * 0.16}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
