"use client";

/**
 * Public menu dish carousel — compact images, infinite loop, smooth eased scroll.
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
const SLIDE_GAP_PX = 24;
const SCROLL_MS = 680;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(min: number, max: number, t: number) {
  return min + (max - min) * t;
}

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
  disabled,
  className,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={direction === "prev" ? "Previous dish" : "Next dish"}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border-0 bg-black text-white outline-none ring-0 shadow-none transition-transform duration-300 ease-out hover:scale-105 focus:outline-none focus-visible:outline-none active:scale-95 disabled:pointer-events-none disabled:opacity-40",
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

  const middleStart = canLoop ? count : 0;

  const [trackIndex, setTrackIndex] = useState(middleStart);
  const [arrowMetrics, setArrowMetrics] = useState({ top: 0, width: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const skipScrollSyncRef = useRef(false);
  const animatingRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const getScrollTarget = useCallback((index: number) => {
    const container = containerRef.current;
    const slide = slideRefs.current[index];
    if (!container || !slide) return null;
    return Math.max(
      0,
      slide.offsetLeft - (container.clientWidth - slide.clientWidth) / 2
    );
  }, []);

  const applyProximityStyles = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const center = container.scrollLeft + container.clientWidth / 2;
    const influence = SLIDE_WIDTH_PX + SLIDE_GAP_PX;

    slideRefs.current.forEach((slide) => {
      if (!slide) return;
      const slideCenter = slide.offsetLeft + slide.clientWidth / 2;
      const dist = Math.abs(slideCenter - center);
      const t = Math.max(0, Math.min(1, 1 - dist / influence));
      const scale = lerp(0.85, 1, t);
      const opacity = lerp(0.4, 1, t);
      slide.style.transform = `scale(${scale.toFixed(3)})`;
      slide.style.opacity = opacity.toFixed(3);
      slide.style.zIndex = t > 0.55 ? "1" : "0";
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

  const jumpToTrackIndex = useCallback(
    (index: number) => {
      const container = containerRef.current;
      const target = getScrollTarget(index);
      if (!container || target === null) return;
      skipScrollSyncRef.current = true;
      container.style.scrollSnapType = "none";
      container.scrollTo({ left: target, behavior: "auto" });
      setTrackIndex(index);
      applyProximityStyles();
      requestAnimationFrame(() => {
        container.style.scrollSnapType = "x mandatory";
        skipScrollSyncRef.current = false;
      });
    },
    [applyProximityStyles, getScrollTarget]
  );

  const normalizeLoopPosition = useCallback(() => {
    if (!canLoop || animatingRef.current) return;
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
    applyProximityStyles();
  }, [applyProximityStyles, canLoop, count, getNearestTrackIndex, jumpToTrackIndex]);

  const animateScrollTo = useCallback(
    (index: number) =>
      new Promise<void>((resolve) => {
        const container = containerRef.current;
        const target = getScrollTarget(index);
        if (!container || target === null) {
          resolve();
          return;
        }

        const start = container.scrollLeft;
        const delta = target - start;
        if (Math.abs(delta) < 1) {
          setTrackIndex(index);
          applyProximityStyles();
          resolve();
          return;
        }

        animatingRef.current = true;
        setIsAnimating(true);
        skipScrollSyncRef.current = true;
        container.style.scrollSnapType = "none";

        const startTime = performance.now();

        const tick = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / SCROLL_MS);
          const eased = easeInOutCubic(progress);
          container.scrollLeft = start + delta * eased;
          applyProximityStyles();

          if (progress < 1) {
            rafRef.current = requestAnimationFrame(tick);
            return;
          }

          container.scrollLeft = target;
          container.style.scrollSnapType = "x mandatory";
          skipScrollSyncRef.current = false;
          animatingRef.current = false;
          setIsAnimating(false);
          setTrackIndex(index);
          applyProximityStyles();
          resolve();
        };

        rafRef.current = requestAnimationFrame(tick);
      }),
    [applyProximityStyles, getScrollTarget]
  );

  const navigateTo = useCallback(
    async (index: number) => {
      if (animatingRef.current || count <= 1) return;
      await animateScrollTo(index);
      normalizeLoopPosition();
    },
    [animateScrollTo, count, normalizeLoopPosition]
  );

  useEffect(() => {
    setTrackIndex(middleStart);
    slideRefs.current = [];
    let attempts = 0;
    const tryCenter = () => {
      attempts += 1;
      if (slideRefs.current[middleStart]) {
        jumpToTrackIndex(middleStart);
        return;
      }
      if (attempts < 12) requestAnimationFrame(tryCenter);
    };
    const id = requestAnimationFrame(tryCenter);
    return () => cancelAnimationFrame(id);
  }, [safeDishes, middleStart, jumpToTrackIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || count <= 1) return;

    const onScroll = () => {
      if (skipScrollSyncRef.current) return;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const nearest = getNearestTrackIndex();
        setTrackIndex(nearest);
        applyProximityStyles();
      });
    };

    const onScrollEnd = () => {
      if (skipScrollSyncRef.current || animatingRef.current) return;
      normalizeLoopPosition();
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    container.addEventListener("scrollend", onScrollEnd);
    return () => {
      container.removeEventListener("scroll", onScroll);
      container.removeEventListener("scrollend", onScrollEnd);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [applyProximityStyles, count, getNearestTrackIndex, normalizeLoopPosition]);

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
  const arrowTop = arrowMetrics.top > 0 ? arrowMetrics.top : 16 + 90;
  const arrowWidth = arrowMetrics.width > 0 ? arrowMetrics.width : 180;

  return (
    <div ref={rootRef} data-carousel-root className="relative mx-auto w-full overflow-visible py-4">
      {showArrows ? (
        <div
          className="pointer-events-none absolute left-1/2 z-30 flex -translate-x-1/2 -translate-y-1/2 items-center justify-between transition-[top,width] duration-300 ease-out"
          style={{ top: arrowTop, width: Math.max(arrowWidth, 180) }}
        >
          <NavArrowButton
            direction="prev"
            disabled={isAnimating}
            onClick={() => navigateTo(trackIndex - 1)}
          />
          <NavArrowButton
            direction="next"
            disabled={isAnimating}
            onClick={() => navigateTo(trackIndex + 1)}
          />
        </div>
      ) : null}

      <div
        ref={containerRef}
        className="menulia-carousel-track flex w-full snap-x snap-mandatory items-center overflow-x-auto overscroll-x-contain touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                "menulia-carousel-slide flex shrink-0 snap-center snap-always flex-col items-center rounded-none origin-center will-change-[transform,opacity]",
                !isActive && "cursor-pointer"
              )}
              style={{ width: SLIDE_WIDTH_PX }}
              onClick={() => {
                if (!isActive && !isAnimating) navigateTo(slot.trackIndex);
              }}
              onKeyDown={(event) => {
                if (isActive || isAnimating || event.key !== "Enter") return;
                navigateTo(slot.trackIndex);
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
