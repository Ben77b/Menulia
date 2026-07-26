"use client";

import { useEffect, useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { RestaurantLogo } from "@/components/restaurant-logo";
import { usePublicMenuSplash } from "@/components/public/public-menu-route-shell";
import { DEFAULT_PUBLIC_MENU_SPLASH } from "@/lib/public-menu-cache";
import { DEFAULT_MENU_THEME } from "@/lib/theme-colors";
import { contrastingTextColor } from "@/lib/contrast";
import { resolvePublicMenuLogoSrc } from "@/lib/public-menu-utils";

export interface PublicMenuLoadingOverlayProps {
  restaurantName?: string;
  restaurantSlug?: string;
  logo?: string | null;
  /** Exact header / logo-area background from Design Studio */
  headerBackgroundColor?: string;
  /** Header text / accent used on that background */
  headerTextColor?: string;
  /** Legacy fallbacks */
  backgroundColor?: string;
  accentColor?: string;
}

/**
 * Brief client loading overlay — paints header brand color for the first paint,
 * then unmounts immediately on hydration (no artificial hold).
 */
export default function PublicMenuLoadingOverlay({
  restaurantName: nameProp,
  restaurantSlug,
  logo: logoProp,
  headerBackgroundColor,
  headerTextColor,
  backgroundColor: bgProp,
  accentColor: accentProp,
}: PublicMenuLoadingOverlayProps) {
  const splash = usePublicMenuSplash();
  const [visible, setVisible] = useState(true);

  const headerBg =
    headerBackgroundColor ||
    bgProp ||
    splash?.backgroundColor ||
    DEFAULT_MENU_THEME.headerBackgroundColor ||
    DEFAULT_PUBLIC_MENU_SPLASH.backgroundColor;

  const contrastOnHeader = contrastingTextColor(headerBg);
  const headerFg =
    headerTextColor ||
    accentProp ||
    splash?.accentColor ||
    contrastOnHeader;

  const restaurantName = nameProp || splash?.restaurantName || "";
  const logo =
    resolvePublicMenuLogoSrc(logoProp ?? splash?.logo ?? null, restaurantSlug) ||
    splash?.logo ||
    null;

  useEffect(() => {
    // Drop the overlay as soon as the client mounts — no artificial delay.
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6"
      style={{
        backgroundColor: headerBg,
        ["--public-menu-header-bg" as string]: headerBg,
        ["--public-menu-header-fg" as string]: headerFg,
      }}
      aria-busy="true"
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
            style={{ color: headerFg }}
          >
            {restaurantName}
          </p>
        ) : (
          <div
            className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/15 bg-white/10 shadow-sm backdrop-blur-sm"
            style={{ color: headerFg }}
          >
            <UtensilsCrossed className="h-10 w-10" strokeWidth={1.5} aria-hidden />
          </div>
        )}
      </div>
    </div>
  );
}
