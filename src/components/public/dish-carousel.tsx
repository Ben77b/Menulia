"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { contrastingTextColor } from "@/lib/contrast";
import { usePreviewCanvas } from "@/contexts/preview-canvas-context";
import { pv } from "@/lib/preview-theme-vars";
import type { PublicMenuDisplayOptions } from "@/lib/display-options";
import type { PublicMenuLocale } from "@/lib/public-menu-i18n";
import { DishCard, type PublicMenuDish } from "./dish-card";

interface DishCarouselProps {
  dishes: PublicMenuDish[];
  lang: PublicMenuLocale;
  fallbackLang?: PublicMenuLocale;
  restaurantName: string;
  accentColor: string;
  arrowIconColor?: string;
  mainTextColor: string;
  titleFont: string;
  bodyFont: string;
  titleFontWeight?: number;
  titleFontStyle?: "normal" | "italic";
  bodyFontWeight?: number;
  bodyFontStyle?: "normal" | "italic";
  display: PublicMenuDisplayOptions;
  titleColor?: string;
  descriptionColor?: string;
  priceColor?: string;
  emptyMessage?: string;
}

const MOBILE_CARD_WIDTH_VW = 70;
const MOBILE_TRACK_GAP_PX = 12; // gap-3
const MOBILE_TRACK_ANCHOR_VW = 13;

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

function mobileTrackTranslate(activeIndex: number): string {
  return `translateX(calc(${MOBILE_TRACK_ANCHOR_VW}vw - (${activeIndex} * (${MOBILE_CARD_WIDTH_VW}vw + ${MOBILE_TRACK_GAP_PX}px))))`;
}

function CarouselCardFrame({
  isActive,
  children,
}: {
  isActive: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "origin-center transition-all duration-300 will-change-transform",
        isActive ? "scale-100 opacity-100" : "scale-[0.82] opacity-40"
      )}
    >
      {children}
    </div>
  );
}

export function DishCarousel({
  dishes,
  lang,
  fallbackLang = "en",
  restaurantName,
  accentColor,
  arrowIconColor,
  mainTextColor,
  titleFont,
  bodyFont,
  titleFontWeight,
  titleFontStyle,
  bodyFontWeight,
  bodyFontStyle,
  display,
  titleColor,
  descriptionColor,
  priceColor,
  emptyMessage = "No dishes in this category.",
}: DishCarouselProps) {
  const safeDishes = useMemo(
    () => (dishes ?? []).filter((dish): dish is PublicMenuDish => Boolean(dish?.id)),
    [dishes]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const isPreview = usePreviewCanvas();
  const arrowColor = isPreview
    ? pv("carouselArrowIcon")
    : arrowIconColor ?? contrastingTextColor(accentColor);

  useEffect(() => {
    setActiveIndex(0);
  }, [safeDishes]);

  useEffect(() => {
    if (activeIndex >= safeDishes.length) {
      setActiveIndex(Math.max(0, safeDishes.length - 1));
    }
  }, [activeIndex, safeDishes.length]);

  const desktopSlots = useMemo(() => {
    if (safeDishes.length <= 1) return [];

    const prevIndex = mod(activeIndex - 1, safeDishes.length);
    const nextIndex = mod(activeIndex + 1, safeDishes.length);

    return [
      { dish: safeDishes[prevIndex], position: "left" as const, key: `${safeDishes[prevIndex].id}-left` },
      { dish: safeDishes[activeIndex], position: "center" as const, key: `${safeDishes[activeIndex].id}-center` },
      { dish: safeDishes[nextIndex], position: "right" as const, key: `${safeDishes[nextIndex].id}-right` },
    ];
  }, [activeIndex, safeDishes]);

  if (safeDishes.length === 0) {
    return (
      <p className="text-center text-sm" style={{ color: mainTextColor }}>
        {emptyMessage}
      </p>
    );
  }

  function goPrevious() {
    setActiveIndex((current) => mod(current - 1, safeDishes.length));
  }

  function goNext() {
    setActiveIndex((current) => mod(current + 1, safeDishes.length));
  }

  function handleTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;

    if (delta > 48) goPrevious();
    else if (delta < -48) goNext();
  }

  function handleDesktopSlotClick(position: "left" | "center" | "right") {
    if (position === "left") goPrevious();
    if (position === "right") goNext();
  }

  const dishCardProps = (dish: PublicMenuDish, isActive: boolean) => ({
    dish,
    lang,
    fallbackLang,
    restaurantName,
    titleFont,
    bodyFont,
    titleFontWeight,
    titleFontStyle,
    bodyFontWeight,
    bodyFontStyle,
    textColor: mainTextColor,
    display,
    titleColor,
    descriptionColor,
    priceColor,
    layout: "carousel" as const,
    compact: !isActive,
    imageClassName: "w-full max-w-[70vw] sm:max-w-none",
    priority: isActive && activeIndex < 3,
  });

  return (
    <div className="relative mx-auto max-w-4xl overflow-visible py-4 sm:px-14">
      {safeDishes.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous dish"
            onClick={goPrevious}
            className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full shadow-md transition-transform duration-200 ease-in-out hover:scale-105 sm:h-11 sm:w-11"
            style={{ backgroundColor: accentColor, color: arrowColor }}
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            aria-label="Next dish"
            onClick={goNext}
            className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full shadow-md transition-transform duration-200 ease-in-out hover:scale-105 sm:h-11 sm:w-11"
            style={{ backgroundColor: accentColor, color: arrowColor }}
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </>
      )}

      {safeDishes.length === 1 ? (
        <div className="mx-auto w-full max-w-[70vw] sm:max-w-[320px]">
          <CarouselCardFrame isActive>
            <DishCard {...dishCardProps(safeDishes[0], true)} priority />
          </CarouselCardFrame>
        </div>
      ) : (
        <>
          {/* Mobile: full track with index-based centering */}
          <div
            className="overflow-visible sm:hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="flex items-center gap-3 transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
              style={{ transform: mobileTrackTranslate(activeIndex) }}
            >
              {safeDishes.map((dish, index) => {
                const isActive = index === activeIndex;

                return (
                  <div
                    key={dish.id}
                    className={cn(
                      "w-[70vw] max-w-[70vw] shrink-0",
                      !isActive && "cursor-pointer"
                    )}
                    onClick={() => {
                      if (!isActive) setActiveIndex(index);
                    }}
                    onKeyDown={(event) => {
                      if (isActive || event.key !== "Enter") return;
                      setActiveIndex(index);
                    }}
                    role={isActive ? undefined : "button"}
                    tabIndex={isActive ? undefined : 0}
                    aria-label={isActive ? undefined : `Show ${dish.id}`}
                  >
                    <CarouselCardFrame isActive={isActive}>
                      <DishCard {...dishCardProps(dish, isActive)} />
                    </CarouselCardFrame>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop: three-slot layout */}
          <div
            className="hidden overflow-visible sm:block"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex items-center justify-center gap-6">
              {desktopSlots.map((slot) => {
                const isActive = slot.position === "center";

                return (
                  <div
                    key={slot.key}
                    className={cn(
                      "shrink-0 sm:w-[min(34vw,200px)]",
                      isActive && "sm:w-[min(78vw,320px)]",
                      !isActive && "cursor-pointer"
                    )}
                    onClick={() => {
                      if (!isActive) handleDesktopSlotClick(slot.position);
                    }}
                    onKeyDown={(event) => {
                      if (isActive || event.key !== "Enter") return;
                      handleDesktopSlotClick(slot.position);
                    }}
                    role={isActive ? undefined : "button"}
                    tabIndex={isActive ? undefined : 0}
                    aria-label={
                      isActive
                        ? undefined
                        : slot.position === "left"
                          ? "Show previous dish"
                          : "Show next dish"
                    }
                  >
                    <CarouselCardFrame isActive={isActive}>
                      <DishCard {...dishCardProps(slot.dish, isActive)} />
                    </CarouselCardFrame>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
