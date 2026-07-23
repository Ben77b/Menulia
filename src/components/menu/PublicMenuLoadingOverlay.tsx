"use client";

import { useEffect, useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { RestaurantLogo } from "@/components/restaurant-logo";
import { usePublicMenuSplash } from "@/components/public/public-menu-route-shell";
import { DEFAULT_PUBLIC_MENU_SPLASH } from "@/lib/public-menu-cache";
import { resolvePublicMenuLogoSrc } from "@/lib/public-menu-utils";
import { cn } from "@/lib/utils";

const HOLD_MS = 1200;
const FADE_MS = 500;

export interface PublicMenuLoadingOverlayProps {
  restaurantName?: string;
  restaurantSlug?: string;
  logo?: string | null;
  backgroundColor?: string;
  accentColor?: string;
}

/**
 * Unconditional client-side loading overlay for public menus.
 * Mounts on every page paint — does not depend on loading.tsx / streaming.
 */
export default function PublicMenuLoadingOverlay({
  restaurantName: nameProp,
  restaurantSlug,
  logo: logoProp,
  backgroundColor: bgProp,
  accentColor: accentProp,
}: PublicMenuLoadingOverlayProps) {
  const splash = usePublicMenuSplash();
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  const backgroundColor =
    bgProp ||
    splash?.backgroundColor ||
    DEFAULT_PUBLIC_MENU_SPLASH.backgroundColor;
  const accentColor =
    accentProp ||
    splash?.accentColor ||
    DEFAULT_PUBLIC_MENU_SPLASH.accentColor;
  const restaurantName = nameProp || splash?.restaurantName || "";
  const logo =
    resolvePublicMenuLogoSrc(logoProp ?? splash?.logo ?? null, restaurantSlug) ||
    splash?.logo ||
    null;

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setFading(true), HOLD_MS);
    const hideTimer = window.setTimeout(() => setVisible(false), HOLD_MS + FADE_MS);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "pointer-events-auto fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6 transition-opacity duration-500 ease-out",
        fading && "pointer-events-none opacity-0"
      )}
      style={{ backgroundColor }}
      aria-busy={!fading}
      aria-live="polite"
      aria-label={restaurantName ? `Loading ${restaurantName} menu` : "Loading menu"}
    >
      <div className="public-menu-intro-mark flex w-full max-w-sm flex-col items-center gap-8">
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
              className="h-2.5 w-2.5 animate-bounce rounded-full"
              style={{
                backgroundColor: accentColor,
                animationDelay: `${index * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
