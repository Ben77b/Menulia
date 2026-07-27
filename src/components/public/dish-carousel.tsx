"use client";

/**
 * Public menu carousel — simple, reliable, smooth.
 * Native scroll-snap + scroll-smooth. Arrows use scrollBy. Infinite via tripled track.
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

const SLIDE_WIDTH_PX = 200;
const SLIDE_GAP_PX = 28;

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

function ArrowButton({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={direction === "prev" ? "Previous dish" : "Next dish"}
      onPointerDown={(event) => {
        // Prevent the scroll track from stealing the gesture on mobile
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      className="flex h-11 w-11 items-center justify-center rounded-full border-0 bg-black text-white outline-none"
      style={{ border: "none", boxShadow: "none", outline: "none", WebkitTapHighlightColor: "transparent" }}
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
  const middleStart = canLoop ? count : 0;

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

  const [activeLogical, setActiveLogical] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const trackIndexRef = useRef(middleStart);
  const lockRef = useRef(false);
  const settleTimerRef = useRef<number | null>(null);

  const getNearestIndex = useCallback(() => {
    const container = containerRef.current;
    if (!container) return trackIndexRef.current;
    const center = container.scrollLeft + container.clientWidth / 2;
    let nearest = 0;
    let best = Number.POSITIVE_INFINITY;
    slideRefs.current.forEach((slide, index) => {
      if (!slide) return;
      const dist = Math.abs(slide.offsetLeft + slide.clientWidth / 2 - center);
      if (dist < best) {
        best = dist;
        nearest = index;
      }
    });
    return nearest;
  }, []);

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const container = containerRef.current;
    const slide = slideRefs.current[index];
    if (!container || !slide) return false;
    const left = slide.offsetLeft - (container.clientWidth - slide.clientWidth) / 2;
    container.scrollTo({ left: Math.max(0, left), behavior });
    trackIndexRef.current = index;
    if (count > 0) setActiveLogical(index % count);
    return true;
  }, [count]);

  const jumpToIndex = useCallback((index: number) => {
    const container = containerRef.current;
    const slide = slideRefs.current[index];
    if (!container || !slide) return;
    lockRef.current = true;
    const left = slide.offsetLeft - (container.clientWidth - slide.clientWidth) / 2;
    container.scrollTo({ left: Math.max(0, left), behavior: "auto" });
    trackIndexRef.current = index;
    if (count > 0) setActiveLogical(index % count);
    window.setTimeout(() => {
      lockRef.current = false;
    }, 40);
  }, [count]);

  const normalizeLoop = useCallback(() => {
    if (!canLoop || lockRef.current) return;
    const nearest = getNearestIndex();
    if (nearest < count) {
      jumpToIndex(nearest + count);
      return;
    }
    if (nearest >= count * 2) {
      jumpToIndex(nearest - count);
      return;
    }
    trackIndexRef.current = nearest;
    setActiveLogical(nearest % count);
  }, [canLoop, count, getNearestIndex, jumpToIndex]);

  const goPrev = useCallback(() => {
    if (count <= 1) return;
    const current = getNearestIndex();
    const next = current - 1;
    lockRef.current = true;
    const moved = scrollToIndex(Math.max(0, next), "smooth");
    if (!moved) {
      lockRef.current = false;
      return;
    }
    window.setTimeout(() => {
      lockRef.current = false;
      normalizeLoop();
    }, 450);
  }, [count, getNearestIndex, normalizeLoop, scrollToIndex]);

  const goNext = useCallback(() => {
    if (count <= 1) return;
    const current = getNearestIndex();
    const next = current + 1;
    const max = loopSlides.length - 1;
    lockRef.current = true;
    const moved = scrollToIndex(Math.min(max, next), "smooth");
    if (!moved) {
      lockRef.current = false;
      return;
    }
    window.setTimeout(() => {
      lockRef.current = false;
      normalizeLoop();
    }, 450);
  }, [count, getNearestIndex, loopSlides.length, normalizeLoop, scrollToIndex]);

  // Start on first dish (middle copy)
  useEffect(() => {
    trackIndexRef.current = middleStart;
    setActiveLogical(0);
    let tries = 0;
    const place = () => {
      tries += 1;
      if (slideRefs.current[middleStart]) {
        jumpToIndex(middleStart);
        return;
      }
      if (tries < 20) requestAnimationFrame(place);
    };
    requestAnimationFrame(place);
  }, [safeDishes, middleStart, jumpToIndex]);

  // Sync active index + loop reset after swipe settles
  useEffect(() => {
    const container = containerRef.current;
    if (!container || count <= 1) return;

    const onScroll = () => {
      if (lockRef.current) return;
      const nearest = getNearestIndex();
      trackIndexRef.current = nearest;
      setActiveLogical(nearest % count);

      if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = window.setTimeout(() => {
        settleTimerRef.current = null;
        if (!lockRef.current) normalizeLoop();
      }, 140);
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);
    };
  }, [count, getNearestIndex, normalizeLoop]);

  if (count === 0) {
    return (
      <p className="text-center text-sm" style={{ color: mainTextColor }}>
        {emptyMessage}
      </p>
    );
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
    imageClassName: "rounded-none",
    priority: false,
    tagLabelMap,
  });

  const sidePad = `calc(50% - ${SLIDE_WIDTH_PX / 2}px)`;
  const showArrows = count > 1;

  return (
    <div className="relative mx-auto w-full overflow-visible py-4">
      {/* Arrows: outside the scroll layer, fixed to the carousel shell */}
      {showArrows ? (
        <>
          <div className="pointer-events-auto absolute left-1 top-[90px] z-50 -translate-y-1/2 sm:left-2">
            <ArrowButton direction="prev" onClick={goPrev} />
          </div>
          <div className="pointer-events-auto absolute right-1 top-[90px] z-50 -translate-y-1/2 sm:right-2">
            <ArrowButton direction="next" onClick={goNext} />
          </div>
        </>
      ) : null}

      <div
        ref={containerRef}
        className="flex w-full snap-x snap-mandatory items-center overflow-x-auto scroll-smooth overscroll-x-contain touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
              ref={(node) => {
                slideRefs.current[slot.trackIndex] = node;
              }}
              className={cn(
                "flex shrink-0 snap-center flex-col items-center rounded-none origin-center transition-[transform,opacity] duration-300 ease-out",
                isActive
                  ? "z-[1] scale-100 opacity-100"
                  : "z-0 scale-[0.88] opacity-45 cursor-pointer"
              )}
              style={{ width: SLIDE_WIDTH_PX }}
              onClick={() => {
                if (isActive) return;
                lockRef.current = true;
                scrollToIndex(slot.trackIndex, "smooth");
                window.setTimeout(() => {
                  lockRef.current = false;
                  normalizeLoop();
                }, 450);
              }}
            >
              <DishCard {...dishCardProps(slot.dish, isActive)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
