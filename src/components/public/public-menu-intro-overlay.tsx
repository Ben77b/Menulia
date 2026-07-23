"use client";

import { useEffect, useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { RestaurantLogo } from "@/components/restaurant-logo";
import { usePublicMenuSplash } from "@/components/public/public-menu-route-shell";
import { DEFAULT_PUBLIC_MENU_SPLASH } from "@/lib/public-menu-cache";
import { resolvePublicMenuLogoSrc } from "@/lib/public-menu-utils";
import { cn } from "@/lib/utils";

const INTRO_HOLD_MS = 1100;
const INTRO_FADE_MS = 500;

interface PublicMenuIntroOverlayProps {
  /** Fallback when splash context has not hydrated yet */
  restaurantName?: string;
  restaurantSlug?: string;
  logo?: string | null;
  backgroundColor?: string;
  accentColor?: string;
}

/**
 * Guaranteed branded intro on every public-menu visit.
 * Survives edge-cached responses that skip `loading.tsx` streaming.
 */
export function PublicMenuIntroOverlay({
  restaurantName: nameProp,
  restaurantSlug,
  logo: logoProp,
  backgroundColor: bgProp,
  accentColor: accentProp,
}: PublicMenuIntroOverlayProps) {
  const splash = usePublicMenuSplash();
  const [phase, setPhase] = useState<"visible" | "fading" | "gone">("visible");

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
    const fadeTimer = window.setTimeout(() => setPhase("fading"), INTRO_HOLD_MS);
    const goneTimer = window.setTimeout(
      () => setPhase("gone"),
      INTRO_HOLD_MS + INTRO_FADE_MS
    );
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(goneTimer);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex min-h-screen w-full flex-col items-center justify-center px-6 transition-opacity duration-500 ease-out",
        phase === "fading" && "pointer-events-none opacity-0"
      )}
      style={{
        backgroundColor,
        ["--public-menu-bg" as string]: backgroundColor,
        ["--public-menu-accent" as string]: accentColor,
      }}
      aria-hidden={phase !== "visible"}
      aria-busy={phase === "visible"}
      aria-label={
        restaurantName ? `Loading ${restaurantName} menu` : "Loading menu"
      }
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

/** Sprint alias — same guaranteed intro overlay. */
export { PublicMenuIntroOverlay as PublicMenuIntroOverlayComponent };
