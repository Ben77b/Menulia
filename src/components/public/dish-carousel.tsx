"use client";

/**
 * Public menu dish carousel — fixed slide slots, snap peeks, native scrollBy.
 * Mobile: 40vw slots + 30vw padding. Images capped by max-h so the dish fits on-screen.
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
  onClick,
  className,
}: {
  direction: "prev" | "next";
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
        "pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border-0 bg-black text-white outline-none ring-0 shadow-none transition-transform duration-200 ease-out hover:scale-105 focus:outline-none focus-visible:outline-none active:scale-95 md:h-11 md:w-11",
        className
      )}
      style={{
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
  accentColor: _accentColor,
  arrowIconColor: _arrowIconColor,
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
  void _accentColor;
  void _arrowIconColor;

  const safeDishes = useMemo(
    () => (dishes ?? []).filter((dish): dish is PublicMenuDish => Boolean(dish?.id)),
    [dishes]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [arrowMetrics, setArrowMetrics] = useState({ top: 0, width: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const skipScrollSyncRef = useRef(false);

  const measureActiveImage = useCallback(() => {
    const root = rootRef.current;
    const slide = slideRefs.current[activeIndex];
    if (!root || !slide) return;
    const img = slide.querySelector("[data-carousel-image]") as HTMLImageElement | null;
    if (!img) return;
    const rootRect = root.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    setArrowMetrics({
      top: imgRect.top - rootRect.top + imgRect.height / 2,
      width: Math.max(imgRect.width, 1),
    });
  }, [activeIndex]);

  const getSlideStep = useCallback(() => {
    const first = slideRefs.current[0];
    const second = slideRefs.current[1];
    if (first && second) {
      return second.offsetLeft - first.offsetLeft;
    }
    if (first) return first.offsetWidth;
    return containerRef.current?.clientWidth ?? 0;
  }, []);

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const container = containerRef.current;
    const slide = slideRefs.current[index];
    if (!container || !slide) return;
    const target =
      slide.offsetLeft - (container.clientWidth - slide.clientWidth) / 2;
    skipScrollSyncRef.current = true;
    container.scrollTo({ left: Math.max(0, target), behavior });
    window.setTimeout(() => {
      skipScrollSyncRef.current = false;
    }, behavior === "smooth" ? 450 : 0);
  }, []);

  // Always open on the first dish, centered in the viewport
  useEffect(() => {
    setActiveIndex(0);
    skipScrollSyncRef.current = true;
    const frame = requestAnimationFrame(() => {
      scrollToIndex(0, "auto");
      window.setTimeout(() => {
        skipScrollSyncRef.current = false;
      }, 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [safeDishes, scrollToIndex]);

  useEffect(() => {
    if (activeIndex >= safeDishes.length) {
      setActiveIndex(Math.max(0, safeDishes.length - 1));
    }
  }, [activeIndex, safeDishes.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || safeDishes.length <= 1) return;

    const syncActiveFromScroll = () => {
      if (skipScrollSyncRef.current) return;
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
    return () => container.removeEventListener("scroll", syncActiveFromScroll);
  }, [safeDishes.length]);

  useEffect(() => {
    measureActiveImage();
    const slide = slideRefs.current[activeIndex];
    const img = slide?.querySelector("[data-carousel-image]") as HTMLImageElement | null;
    img?.addEventListener("load", measureActiveImage);
    window.addEventListener("resize", measureActiveImage);
    const container = containerRef.current;
    container?.addEventListener("scroll", measureActiveImage, { passive: true });
    return () => {
      img?.removeEventListener("load", measureActiveImage);
      window.removeEventListener("resize", measureActiveImage);
      container?.removeEventListener("scroll", measureActiveImage);
    };
  }, [measureActiveImage, activeIndex, safeDishes.length]);

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

    container.scrollBy({ left: -getSlideStep(), behavior: "smooth" });
  }

  function goNext() {
    const container = containerRef.current;
    if (!container || safeDishes.length <= 1) return;

    if (activeIndex >= safeDishes.length - 1) {
      scrollToIndex(0);
      return;
    }

    container.scrollBy({ left: getSlideStep(), behavior: "smooth" });
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
    imageClassName: "w-full rounded-none",
    priority: false,
    tagLabelMap,
  });

  const showArrows = safeDishes.length > 1;

  return (
    <div ref={rootRef} data-carousel-root className="relative mx-auto w-full overflow-visible py-4">
      {showArrows && arrowMetrics.width > 0 ? (
        <div
          className="pointer-events-none absolute left-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center justify-between"
          style={{ top: arrowMetrics.top, width: arrowMetrics.width }}
        >
          <NavArrowButton direction="prev" onClick={goPrevious} />
          <NavArrowButton direction="next" onClick={goNext} />
        </div>
      ) : null}

      {/*
        Compact slots so image + text fit without page scroll; side peeks stay visible.
        Mobile: 40vw card, 30vw pad. Desktop: 28vw card, 36vw pad.
      */}
      <div
        ref={containerRef}
        className="flex w-full snap-x snap-mandatory items-center gap-5 overflow-x-auto scroll-smooth px-[30vw] md:gap-6 md:px-[36vw] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                "flex w-[40vw] shrink-0 snap-center flex-col items-center rounded-none origin-center will-change-transform md:w-[28vw]",
                isActive
                  ? "z-[1] scale-100 opacity-100 transition-all duration-500 ease-out"
                  : "z-0 scale-[0.85] opacity-40 transition-all duration-500 ease-out cursor-pointer"
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
