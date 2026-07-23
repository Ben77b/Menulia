"use client";

import { useEffect, useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { RestaurantLogo } from "@/components/restaurant-logo";
import { usePublicMenuSplash } from "@/components/public/public-menu-route-shell";
import { DEFAULT_PUBLIC_MENU_SPLASH } from "@/lib/public-menu-cache";
import { DEFAULT_MENU_THEME } from "@/lib/theme-colors";
import { contrastingTextColor } from "@/lib/contrast";
import { resolvePublicMenuLogoSrc } from "@/lib/public-menu-utils";
import { cn } from "@/lib/utils";

const HOLD_MS = 1100;
const FADE_MS = 450;

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
 * Unconditional client loading overlay — paints header brand color instantly,
 * then fades out to reveal the menu.
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
  const [fading, setFading] = useState(false);

  // Prefer Design Studio header/logo-area background for a seamless header match.
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
      style={{
        backgroundColor: headerBg,
        // Synchronous paint vars — avoid white/dark flash before theme resolves.
        ["--public-menu-header-bg" as string]: headerBg,
        ["--public-menu-header-fg" as string]: headerFg,
      }}
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

        <div className="flex items-center gap-3" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="public-menu-loading-dot h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: headerFg,
                animationDelay: `${index * 150}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
