"use client";

/**
 * Public menu dish carousel — pure React + Tailwind CSS scroll-snap.
 * Peek math: px-[20vw] + w-[60vw] → 20vw side peeks. Physical slide via scrollBy.
 * Active = scale-100 opacity-100; inactive peeks = scale-90 opacity-40.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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
        "pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border-0 outline-none ring-0 shadow-none transition-transform duration-200 ease-out hover:scale-105 focus:outline-none focus-visible:outline-none active:scale-95 sm:h-11 sm:w-11",
        className
      )}
      style={{
        backgroundColor: accentColor,
        color: arrowColor,
        border: "none",
        boxShadow: "none",
        outline: "none",
      }}
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
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const isPreview = usePreviewCanvas();
  const arrowColor = isPreview
    ? pv("carouselArrowIcon")
    : arrowIconColor ?? contrastingTextColor(accentColor);

  const getSlideStep = useCallback(() => {
    const first = slideRefs.current[0];
    const second = slideRefs.current[1];
    if (first && second) {
      return second.offsetLeft - first.offsetLeft;
    }
    if (first) return first.offsetWidth;
    return containerRef.current?.clientWidth ?? 0;
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const container = containerRef.current;
    const slide = slideRefs.current[index];
    if (!container || !slide) return;
    const target =
      slide.offsetLeft - (container.clientWidth - slide.clientWidth) / 2;
    container.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, []);

  useEffect(() => {
    setActiveIndex(0);
    const container = containerRef.current;
    if (container) container.scrollTo({ left: 0, behavior: "auto" });
  }, [safeDishes]);

  useEffect(() => {
    if (activeIndex >= safeDishes.length) {
      setActiveIndex(Math.max(0, safeDishes.length - 1));
    }
  }, [activeIndex, safeDishes.length]);

  // Scroll-position sync for active (centered) index
  useEffect(() => {
    const container = containerRef.current;
    if (!container || safeDishes.length <= 1) return;

    const syncActiveFromScroll = () => {
      const center = container.scrollLeft + container.clientWidth / 2;
      let nearest = 0;
      let nearestDist = Number.POSITIVE_INFINITY;
      slideRefs.current.forEach((slide, index) => {
        if (!slide) return;
        const slideCenter = slide.offsetLeft + slide.clientWidth / 2;
        const dist = Math.abs(slideCenter - center);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = index;
        }
      });
      setActiveIndex((current) => (current === nearest ? current : nearest));
    };

    container.addEventListener("scroll", syncActiveFromScroll, { passive: true });
    syncActiveFromScroll();
    return () => container.removeEventListener("scroll", syncActiveFromScroll);
  }, [safeDishes.length]);

  // IntersectionObserver backup — reinforces centered active index for peek styling
  useEffect(() => {
    const container = containerRef.current;
    if (!container || safeDishes.length <= 1) return;

    const ratios = new Map<number, number>();
    const observer = new IntersectionObserver(
      (entries) => {
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
        if (bestRatio >= 0.5) {
          setActiveIndex((current) => (current === bestIndex ? current : bestIndex));
        }
      },
      { root: container, threshold: [0.4, 0.5, 0.6, 0.75, 0.9, 1] }
    );

    slideRefs.current.forEach((slide) => {
      if (slide) observer.observe(slide);
    });
    return () => observer.disconnect();
  }, [safeDishes.length]);

  if (safeDishes.length === 0) {
    return (
      <p className="text-center text-sm" style={{ color: mainTextColor }}>
        {emptyMessage}
      </p>
    );
  }

  function goPrevious() {
    const container = containerRef.current;
    if (!container || safeDishes.length <= 1) return;

    if (activeIndex <= 0) {
      scrollToIndex(safeDishes.length - 1);
      return;
    }

    const distance = getSlideStep();
    container.scrollBy({ left: -distance, behavior: "smooth" });
  }

  function goNext() {
    const container = containerRef.current;
    if (!container || safeDishes.length <= 1) return;

    if (activeIndex >= safeDishes.length - 1) {
      scrollToIndex(0);
      return;
    }

    const distance = getSlideStep();
    container.scrollBy({ left: distance, behavior: "smooth" });
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
    <div className="relative mx-auto w-full max-w-4xl overflow-visible py-4">
      {/* Arrow band = square image height (60vw card → 60vw image). Centers on photo only. */}
      {showArrows ? (
        <div className="pointer-events-none absolute left-0 right-0 top-4 z-20 h-[60vw]">
          <NavArrowButton
            direction="prev"
            accentColor={accentColor}
            arrowColor={arrowColor}
            onClick={goPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 sm:left-1"
          />
          <NavArrowButton
            direction="next"
            accentColor={accentColor}
            arrowColor={arrowColor}
            onClick={goNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 sm:right-1"
          />
        </div>
      ) : null}

      {/* Peek track: 20vw padding + 60vw cards → 20vw peeks on each side */}
      <div
        ref={containerRef}
        className="flex w-full snap-x snap-mandatory items-start gap-3 overflow-x-auto scroll-smooth px-[20vw] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {safeDishes.map((dish, index) => {
          const isActive = index === activeIndex;

          return (
            <div
              key={dish.id}
              data-index={index}
              data-active={isActive ? "true" : "false"}
              ref={(node) => {
                slideRefs.current[index] = node;
              }}
              className={cn(
                "w-[60vw] shrink-0 snap-center origin-center will-change-transform",
                // RESTORED out-of-focus peek styling — applied on the slide DOM node
                isActive
                  ? "z-[1] scale-100 opacity-100 transition-all duration-500 ease-in-out"
                  : "z-0 scale-90 opacity-40 transition-all duration-500 ease-in-out cursor-pointer"
              )}
              onClick={() => {
                if (!isActive) scrollToIndex(index);
              }}
              onKeyDown={(event) => {
                if (isActive || event.key !== "Enter") return;
                scrollToIndex(index);
              }}
              role={isActive ? undefined : "button"}
              tabIndex={isActive ? undefined : 0}
              aria-label={isActive ? undefined : `Show dish ${index + 1}`}
              aria-current={isActive ? "true" : undefined}
            >
              <DishCard {...dishCardProps(dish, isActive)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
