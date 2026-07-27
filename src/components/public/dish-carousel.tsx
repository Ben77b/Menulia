"use client";

/**
 * Public menu dish carousel.
 * - Compact fixed image size (hard max 180px) so dishes fit on screen
 * - Infinite loop via tripled slide track + silent jump
 * - Side peeks, faded inactive slides, native smooth scrollBy
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

/** Slide slot width — images are capped smaller inside */
const SLIDE_WIDTH_PX = 200;
const SLIDE_GAP_PX = 24;

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
        "pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border-0 bg-black text-white outline-none ring-0 shadow-none transition-transform duration-200 ease-out hover:scale-105 focus:outline-none focus-visible:outline-none active:scale-95",
        className
      )}
      style={{ border: "none", boxShadow: "none", outline: "none" }}
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
  const count = safeDishes.length;
  const canLoop = count > 1;

  // Triple the track for seamless infinite scrolling
  const loopSlides = useMemo(() => {
    if (!canLoop) {
      return safeDishes.map((dish, i) => ({
        dish,
        key: `${dish.id}-only`,
        logicalIndex: i,
        trackIndex: i,
      }));
    }
    return [...safeDishes, ...safeDishes, ...safeDishes].map((dish, trackIndex) => ({
      dish,
      key: `${dish.id}-t${trackIndex}`,
      logicalIndex: trackIndex % count,
      trackIndex,
    }));
  }, [canLoop, count, safeDishes]);

  /** Middle copy of dish 0 — where we start and jump back to */
  const middleStart = canLoop ? count : 0;

  const [trackIndex, setTrackIndex] = useState(middleStart);
  const [arrowMetrics, setArrowMetrics] = useState({ top: 0, width: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const skipScrollSyncRef = useRef(false);

  const scrollToTrackIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const container = containerRef.current;
      const slide = slideRefs.current[index];
      if (!container || !slide) return;
      const target =
        slide.offsetLeft - (container.clientWidth - slide.clientWidth) / 2;
      skipScrollSyncRef.current = true;
      container.scrollTo({ left: Math.max(0, target), behavior });
      window.setTimeout(
        () => {
          skipScrollSyncRef.current = false;
        },
        behavior === "smooth" ? 420 : 0
      );
    },
    []
  );

  const jumpToTrackIndex = useCallback((index: number) => {
    const container = containerRef.current;
    const slide = slideRefs.current[index];
    if (!container || !slide) return;
    const target =
      slide.offsetLeft - (container.clientWidth - slide.clientWidth) / 2;
    skipScrollSyncRef.current = true;
    container.scrollTo({ left: Math.max(0, target), behavior: "auto" });
    setTrackIndex(index);
    requestAnimationFrame(() => {
      skipScrollSyncRef.current = false;
    });
  }, []);

  const getNearestTrackIndex = useCallback(() => {
    const container = containerRef.current;
    if (!container) return trackIndex;
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
    return nearest;
  }, [trackIndex]);

  /** If user lands on a clone set, silently jump to the matching middle copy */
  const normalizeLoopPosition = useCallback(() => {
    if (!canLoop) return;
    const nearest = getNearestTrackIndex();
    if (nearest < count) {
      jumpToTrackIndex(nearest + count);
      return;
    }
    if (nearest >= count * 2) {
      jumpToTrackIndex(nearest - count);
      return;
    }
    setTrackIndex(nearest);
  }, [canLoop, count, getNearestTrackIndex, jumpToTrackIndex]);

  // Start on the first dish (middle copy)
  useEffect(() => {
    setTrackIndex(middleStart);
    slideRefs.current = [];
    let attempts = 0;
    const tryCenter = () => {
      attempts += 1;
      const slide = slideRefs.current[middleStart];
      if (slide) {
        jumpToTrackIndex(middleStart);
        return;
      }
      if (attempts < 10) {
        requestAnimationFrame(tryCenter);
      }
    };
    const id = requestAnimationFrame(tryCenter);
    return () => cancelAnimationFrame(id);
  }, [safeDishes, middleStart, jumpToTrackIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || count <= 1) return;

    let settleTimer: number | null = null;

    const onScroll = () => {
      if (skipScrollSyncRef.current) return;
      const nearest = getNearestTrackIndex();
      setTrackIndex(nearest);

      if (settleTimer !== null) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        normalizeLoopPosition();
      }, 120);
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      if (settleTimer !== null) window.clearTimeout(settleTimer);
    };
  }, [count, getNearestTrackIndex, normalizeLoopPosition]);

  const measureActiveImage = useCallback(() => {
    const root = rootRef.current;
    const slide = slideRefs.current[trackIndex];
    if (!root || !slide) return;
    const img = slide.querySelector("[data-carousel-image]") as HTMLImageElement | null;
    if (!img) return;
    const rootRect = root.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    setArrowMetrics({
      top: imgRect.top - rootRect.top + imgRect.height / 2,
      width: Math.max(imgRect.width, 1),
    });
  }, [trackIndex]);

  useEffect(() => {
    measureActiveImage();
    const slide = slideRefs.current[trackIndex];
    const img = slide?.querySelector("[data-carousel-image]") as HTMLImageElement | null;
    img?.addEventListener("load", measureActiveImage);
    window.addEventListener("resize", measureActiveImage);
    return () => {
      img?.removeEventListener("load", measureActiveImage);
      window.removeEventListener("resize", measureActiveImage);
    };
  }, [measureActiveImage, trackIndex, loopSlides.length]);

  if (count === 0) {
    return (
      <p className="text-center text-sm" style={{ color: mainTextColor }}>
        {emptyMessage}
      </p>
    );
  }

  function goPrevious() {
    if (count <= 1) return;
    const next = trackIndex - 1;
    scrollToTrackIndex(next);
    setTrackIndex(next);
    window.setTimeout(() => normalizeLoopPosition(), 450);
  }

  function goNext() {
    if (count <= 1) return;
    const next = trackIndex + 1;
    scrollToTrackIndex(next);
    setTrackIndex(next);
    window.setTimeout(() => normalizeLoopPosition(), 450);
  }

  const activeLogical = canLoop ? trackIndex % count : trackIndex;

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
    imageClassName: "rounded-none",
    priority: false,
    tagLabelMap,
  });

  const showArrows = count > 1;
  const sidePad = `calc(50% - ${SLIDE_WIDTH_PX / 2}px)`;

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

      <div
        ref={containerRef}
        className="flex w-full snap-x snap-mandatory items-center overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          WebkitOverflowScrolling: "touch",
          gap: SLIDE_GAP_PX,
          paddingLeft: sidePad,
          paddingRight: sidePad,
        }}
      >
        {loopSlides.map((slot) => {
          const isActive = slot.logicalIndex === activeLogical;

          return (
            <div
              key={slot.key}
              data-index={slot.trackIndex}
              data-logical={slot.logicalIndex}
              data-active={isActive ? "true" : "false"}
              ref={(node) => {
                slideRefs.current[slot.trackIndex] = node;
              }}
              className={cn(
                "flex shrink-0 snap-center flex-col items-center rounded-none origin-center will-change-transform",
                isActive
                  ? "z-[1] scale-100 opacity-100 transition-all duration-500 ease-out"
                  : "z-0 scale-[0.85] opacity-40 transition-all duration-500 ease-out cursor-pointer"
              )}
              style={{ width: SLIDE_WIDTH_PX }}
              onClick={() => {
                if (!isActive) {
                  scrollToTrackIndex(slot.trackIndex);
                  setTrackIndex(slot.trackIndex);
                  window.setTimeout(() => normalizeLoopPosition(), 450);
                }
              }}
              onKeyDown={(event) => {
                if (isActive || event.key !== "Enter") return;
                scrollToTrackIndex(slot.trackIndex);
                setTrackIndex(slot.trackIndex);
                window.setTimeout(() => normalizeLoopPosition(), 450);
              }}
              role={isActive ? undefined : "button"}
              tabIndex={isActive ? undefined : 0}
              aria-label={isActive ? undefined : `Show dish ${slot.logicalIndex + 1}`}
              aria-current={isActive ? "true" : undefined}
            >
              <DishCard {...dishCardProps(slot.dish, isActive)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
