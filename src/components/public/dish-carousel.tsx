"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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
        "origin-center transition-[transform,opacity] duration-300 ease-out will-change-transform",
        isActive
          ? "z-[1] scale-100 opacity-100"
          : "z-0 scale-90 opacity-50"
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
        "z-10 flex h-11 w-11 items-center justify-center rounded-full shadow-md ring-1 ring-black/10 transition-transform duration-200 ease-out hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-95",
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
  const touchStartX = useRef<number | null>(null);
  const mobileScrollerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const skipScrollSyncRef = useRef(false);
  const isPreview = usePreviewCanvas();
  const arrowColor = isPreview
    ? pv("carouselArrowIcon")
    : arrowIconColor ?? contrastingTextColor(accentColor);

  const scrollMobileToIndex = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const scroller = mobileScrollerRef.current;
    const slide = slideRefs.current[index];
    if (!scroller || !slide) return;
    skipScrollSyncRef.current = true;
    const target =
      slide.offsetLeft - (scroller.clientWidth - slide.clientWidth) / 2;
    scroller.scrollTo({ left: Math.max(0, target), behavior });
    window.setTimeout(() => {
      skipScrollSyncRef.current = false;
    }, behavior === "smooth" ? 400 : 0);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
    const scroller = mobileScrollerRef.current;
    if (scroller) {
      skipScrollSyncRef.current = true;
      scroller.scrollTo({ left: 0, behavior: "auto" });
      window.setTimeout(() => {
        skipScrollSyncRef.current = false;
      }, 0);
    }
  }, [safeDishes]);

  useEffect(() => {
    if (activeIndex >= safeDishes.length) {
      setActiveIndex(Math.max(0, safeDishes.length - 1));
    }
  }, [activeIndex, safeDishes.length]);

  // Keep mobile scroller aligned when active index changes via arrows
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 639px)").matches) return;
    scrollMobileToIndex(activeIndex);
  }, [activeIndex, scrollMobileToIndex]);

  // Detect centered slide via IntersectionObserver (mobile snap track)
  useEffect(() => {
    const scroller = mobileScrollerRef.current;
    if (!scroller || safeDishes.length <= 1) return;

    const ratios = new Map<number, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        if (skipScrollSyncRef.current) return;
        for (const entry of entries) {
          const index = Number((entry.target as HTMLElement).dataset.index);
          if (Number.isNaN(index)) continue;
          ratios.set(index, entry.isIntersecting ? entry.intersectionRatio : 0);
        }
        let bestIndex = 0;
        let bestRatio = -1;
        ratios.forEach((ratio, index) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIndex = index;
          }
        });
        if (bestRatio > 0.45) {
          setActiveIndex((current) => (current === bestIndex ? current : bestIndex));
        }
      },
      {
        root: scroller,
        threshold: [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
      }
    );

    slideRefs.current.forEach((slide) => {
      if (slide) observer.observe(slide);
    });

    return () => observer.disconnect();
  }, [safeDishes.length]);

  const desktopSlots = useMemo(() => {
    if (safeDishes.length <= 1) return [];

    const clampedIndex = Math.min(
      Math.max(0, activeIndex),
      safeDishes.length - 1
    );
    const prevIndex = mod(clampedIndex - 1, safeDishes.length);
    const nextIndex = mod(clampedIndex + 1, safeDishes.length);
    const center = safeDishes[clampedIndex];
    const prev = safeDishes[prevIndex];
    const next = safeDishes[nextIndex];
    if (!center?.id || !prev?.id || !next?.id) return [];

    return [
      { dish: prev, position: "left" as const, key: `${prev.id}-left` },
      { dish: center, position: "center" as const, key: `${center.id}-center` },
      { dish: next, position: "right" as const, key: `${next.id}-right` },
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

    // Desktop three-slot still uses swipe deltas; mobile relies on native snap scroll.
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
    imageClassName: "w-full max-w-[80vw] sm:max-w-none",
    priority: false,
    tagLabelMap,
  });

  const showArrows = safeDishes.length > 1;

  return (
    <div className="relative mx-auto max-w-4xl overflow-visible py-4 max-sm:-mx-4 sm:px-14">
      {/* Desktop side arrows */}
      {showArrows && (
        <>
          <NavArrowButton
            direction="prev"
            accentColor={accentColor}
            arrowColor={arrowColor}
            onClick={goPrevious}
            className="absolute left-0 top-1/2 hidden -translate-y-1/2 sm:flex"
          />
          <NavArrowButton
            direction="next"
            accentColor={accentColor}
            arrowColor={arrowColor}
            onClick={goNext}
            className="absolute right-0 top-1/2 hidden -translate-y-1/2 sm:flex"
          />
        </>
      )}

      {safeDishes.length === 1 ? (
        <div className="mx-auto w-full max-w-[80vw] sm:max-w-[320px]">
          <CarouselCardFrame isActive>
            <DishCard {...dishCardProps(safeDishes[0], true)} />
          </CarouselCardFrame>
        </div>
      ) : (
        <>
          {/* Mobile: peek carousel via CSS scroll-snap */}
          <div
            ref={mobileScrollerRef}
            className="flex snap-x snap-mandatory overflow-x-auto overflow-y-visible overscroll-x-contain touch-pan-x scroll-px-[10vw] px-[10vw] sm:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {safeDishes.map((dish, index) => {
              const isActive = index === activeIndex;

              return (
                <div
                  key={dish.id}
                  data-index={index}
                  ref={(node) => {
                    slideRefs.current[index] = node;
                  }}
                  className={cn(
                    "w-[80vw] max-w-[80vw] flex-shrink-0 snap-center px-1.5",
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
                  aria-label={isActive ? undefined : `Show dish ${index + 1}`}
                  aria-current={isActive ? "true" : undefined}
                >
                  <CarouselCardFrame isActive={isActive}>
                    <DishCard {...dishCardProps(dish, isActive)} />
                  </CarouselCardFrame>
                </div>
              );
            })}
          </div>

          {/* Mobile arrows — below track so they never cover dish images */}
          {showArrows && (
            <div className="mt-5 flex items-center justify-center gap-8 sm:hidden">
              <NavArrowButton
                direction="prev"
                accentColor={accentColor}
                arrowColor={arrowColor}
                onClick={goPrevious}
              />
              <span
                className="min-w-[3.5rem] text-center text-xs font-medium tabular-nums tracking-wide opacity-70"
                style={{ color: mainTextColor }}
                aria-live="polite"
              >
                {activeIndex + 1} / {safeDishes.length}
              </span>
              <NavArrowButton
                direction="next"
                accentColor={accentColor}
                arrowColor={arrowColor}
                onClick={goNext}
              />
            </div>
          )}

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
