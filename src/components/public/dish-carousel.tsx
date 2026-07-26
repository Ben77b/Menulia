"use client";

/**
 * Public menu dish carousel — pure React + Tailwind (no Embla/Swiper/Framer).
 * Architecture: three-slot peek (prev | active | next). Swipe + arrow buttons change index.
 */
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
  tagLabelMap?: Record<string, string>;
}

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
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
        "origin-center transition-all duration-500 ease-in-out will-change-transform",
        isActive
          ? "z-[1] scale-100 opacity-100"
          : "z-0 scale-90 opacity-40"
      )}
    >
      {children}
    </div>
  );
}

function NavArrowButton({
  direction,
  accentColor,
  arrowColor,
  onClick,
  className,
}: {
  direction: "prev" | "next";
  accentColor: string;
  arrowColor: string;
  onClick: () => void;
  className?: string;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={direction === "prev" ? "Previous dish" : "Next dish"}
      onClick={onClick}
      className={cn(
        "pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full shadow-lg ring-2 ring-white/80 transition-transform duration-200 ease-out hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 sm:h-11 sm:w-11",
        className
      )}
      style={{ backgroundColor: accentColor, color: arrowColor }}
    >
      <Icon className="h-5 w-5" strokeWidth={2.5} />
    </button>
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
  tagLabelMap,
}: DishCarouselProps) {
  const safeDishes = useMemo(
    () => (dishes ?? []).filter((dish): dish is PublicMenuDish => Boolean(dish?.id)),
    [dishes]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideDir, setSlideDir] = useState<"prev" | "next" | null>(null);
  const touchStartX = useRef<number | null>(null);
  const slideClearRef = useRef<number | null>(null);
  const isPreview = usePreviewCanvas();
  const arrowColor = isPreview
    ? pv("carouselArrowIcon")
    : arrowIconColor ?? contrastingTextColor(accentColor);

  useEffect(() => {
    setActiveIndex(0);
    setSlideDir(null);
  }, [safeDishes]);

  useEffect(() => {
    if (activeIndex >= safeDishes.length) {
      setActiveIndex(Math.max(0, safeDishes.length - 1));
    }
  }, [activeIndex, safeDishes.length]);

  useEffect(() => {
    return () => {
      if (slideClearRef.current !== null) window.clearTimeout(slideClearRef.current);
    };
  }, []);

  const slots = useMemo(() => {
    if (safeDishes.length === 0) return [];
    if (safeDishes.length === 1) {
      const only = safeDishes[0];
      if (!only?.id) return [];
      return [{ dish: only, position: "center" as const, key: `${only.id}-center` }];
    }

    const clampedIndex = Math.min(Math.max(0, activeIndex), safeDishes.length - 1);
    const prevIndex = mod(clampedIndex - 1, safeDishes.length);
    const nextIndex = mod(clampedIndex + 1, safeDishes.length);
    const center = safeDishes[clampedIndex];
    const prev = safeDishes[prevIndex];
    const next = safeDishes[nextIndex];
    if (!center?.id || !prev?.id || !next?.id) return [];

    return [
      { dish: prev, position: "left" as const, key: `${prev.id}-left-${clampedIndex}` },
      { dish: center, position: "center" as const, key: `${center.id}-center-${clampedIndex}` },
      { dish: next, position: "right" as const, key: `${next.id}-right-${clampedIndex}` },
    ];
  }, [activeIndex, safeDishes]);

  if (safeDishes.length === 0) {
    return (
      <p className="text-center text-sm" style={{ color: mainTextColor }}>
        {emptyMessage}
      </p>
    );
  }

  function triggerSlide(direction: "prev" | "next") {
    if (slideClearRef.current !== null) window.clearTimeout(slideClearRef.current);
    setSlideDir(direction);
    slideClearRef.current = window.setTimeout(() => {
      setSlideDir(null);
      slideClearRef.current = null;
    }, 500);
  }

  function goPrevious() {
    triggerSlide("prev");
    setActiveIndex((current) => mod(current - 1, safeDishes.length));
  }

  function goNext() {
    triggerSlide("next");
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
    if (delta > 40) goPrevious();
    else if (delta < -40) goNext();
  }

  function handleSlotActivate(position: "left" | "center" | "right") {
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
    imageClassName: "w-full",
    priority: false,
    tagLabelMap,
  });

  const showArrows = safeDishes.length > 1;

  return (
    // overflow-visible is required — overflow-hidden on ancestors clips peeks
    <div
      className="relative mx-auto w-full max-w-4xl overflow-visible py-4"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Side arrows — vertically aligned with the dish image (upper half of the slot row) */}
      {showArrows ? (
        <>
          <NavArrowButton
            direction="prev"
            accentColor={accentColor}
            arrowColor={arrowColor}
            onClick={goPrevious}
            className="absolute left-0 top-[18vw] z-20 -translate-y-1/2 sm:left-1 sm:top-[min(18vw,110px)]"
          />
          <NavArrowButton
            direction="next"
            accentColor={accentColor}
            arrowColor={arrowColor}
            onClick={goNext}
            className="absolute right-0 top-[18vw] z-20 -translate-y-1/2 sm:right-1 sm:top-[min(18vw,110px)]"
          />
        </>
      ) : null}

      {/* Three-slot peek row: left (faded) | center (focus) | right (faded) */}
      <div
        className={cn(
          "flex w-full items-center justify-center gap-2 overflow-visible px-9 scroll-smooth sm:gap-5 sm:px-14",
          slideDir === "next" && "menulia-carousel-slide-next",
          slideDir === "prev" && "menulia-carousel-slide-prev"
        )}
      >
        {slots.map((slot) => {
          const isActive = slot.position === "center";

          return (
            <div
              key={slot.key}
              className={cn(
                "shrink-0 overflow-visible transition-all duration-500 ease-in-out",
                // Peek slides: always partially on-screen beside the center dish
                slot.position !== "center" &&
                  "w-[22%] max-w-[110px] sm:w-[min(28vw,180px)] sm:max-w-[180px]",
                // Active center dish (wider when it is the only slide)
                isActive &&
                  (safeDishes.length === 1
                    ? "w-[72%] max-w-[300px] sm:w-[min(70vw,320px)]"
                    : "w-[52%] max-w-[280px] sm:w-[min(56vw,320px)] sm:max-w-[320px]"),
                !isActive && "cursor-pointer"
              )}
              onClick={() => {
                if (!isActive) handleSlotActivate(slot.position);
              }}
              onKeyDown={(event) => {
                if (isActive || event.key !== "Enter") return;
                handleSlotActivate(slot.position);
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
              aria-current={isActive ? "true" : undefined}
            >
              <CarouselCardFrame isActive={isActive}>
                <DishCard {...dishCardProps(slot.dish, isActive)} />
              </CarouselCardFrame>
            </div>
          );
        })}
      </div>
    </div>
  );
}
