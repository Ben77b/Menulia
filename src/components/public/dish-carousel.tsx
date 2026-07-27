"use client";

/**
 * Public menu carousel — fluid scroll, soft snap, seamless infinite loop.
 * Arrows are always clickable and sit outside the center image.
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
const ARROW_SCROLL_MS = 720;
const SETTLE_SCROLL_MS = 420;

function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4);
}

function smoothstep(t: number) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
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
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        "pointer-events-auto relative z-40 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-0 bg-black text-white outline-none ring-0 shadow-none transition-transform duration-200 ease-out hover:scale-105 focus:outline-none active:scale-95",
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
  const [arrowTop, setArrowTop] = useState(106);

  const rootRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const trackIndexRef = useRef(middleStart);
  const skipScrollSyncRef = useRef(false);
  const animatingRef = useRef(false);
  const visualLoopRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const rafScrollRef = useRef<number | null>(null);

  const setTrackIndexSafe = useCallback((index: number) => {
    trackIndexRef.current = index;
    setTrackIndex(index);
  }, []);

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
    const influence = (SLIDE_WIDTH_PX + SLIDE_GAP_PX) * 1.75;

    slideRefs.current.forEach((slide) => {
      if (!slide) return;
      const slideCenter = slide.offsetLeft + slide.clientWidth / 2;
      const dist = Math.abs(slideCenter - center);
      const raw = Math.max(0, 1 - dist / influence);
      const t = smoothstep(raw);
      const scale = lerp(0.88, 1, t);
      const opacity = lerp(0.42, 1, t);
      slide.style.transform = `scale(${scale.toFixed(4)}) translateZ(0)`;
      slide.style.opacity = opacity.toFixed(4);
      slide.style.zIndex = t > 0.45 ? "1" : "0";
    });
  }, []);

  const startVisualLoop = useCallback(() => {
    if (visualLoopRef.current !== null) return;
    const tick = () => {
      applyProximityStyles();
      visualLoopRef.current = requestAnimationFrame(tick);
    };
    visualLoopRef.current = requestAnimationFrame(tick);
  }, [applyProximityStyles]);

  const stopVisualLoop = useCallback(() => {
    if (visualLoopRef.current !== null) {
      cancelAnimationFrame(visualLoopRef.current);
      visualLoopRef.current = null;
    }
  }, []);

  const getNearestTrackIndex = useCallback(() => {
    const container = containerRef.current;
    if (!container) return trackIndexRef.current;
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
  }, []);

  const jumpToTrackIndex = useCallback(
    (index: number) => {
      const container = containerRef.current;
      const target = getScrollTarget(index);
      if (!container || target === null) return;
      skipScrollSyncRef.current = true;
      container.style.scrollSnapType = "none";
      container.scrollTo({ left: target, behavior: "auto" });
      setTrackIndexSafe(index);
      applyProximityStyles();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          container.style.scrollSnapType = "";
          skipScrollSyncRef.current = false;
        });
      });
    },
    [applyProximityStyles, getScrollTarget, setTrackIndexSafe]
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
    setTrackIndexSafe(nearest);
    applyProximityStyles();
  }, [
    applyProximityStyles,
    canLoop,
    count,
    getNearestTrackIndex,
    jumpToTrackIndex,
    setTrackIndexSafe,
  ]);

  const animateScrollTo = useCallback(
    (index: number, duration = ARROW_SCROLL_MS) =>
      new Promise<boolean>((resolve) => {
        const container = containerRef.current;
        const target = getScrollTarget(index);
        if (!container || target === null) {
          resolve(false);
          return;
        }

        if (rafScrollRef.current !== null) {
          cancelAnimationFrame(rafScrollRef.current);
          rafScrollRef.current = null;
        }

        const start = container.scrollLeft;
        const delta = target - start;
        if (Math.abs(delta) < 0.5) {
          setTrackIndexSafe(index);
          applyProximityStyles();
          resolve(true);
          return;
        }

        animatingRef.current = true;
        skipScrollSyncRef.current = true;
        container.style.scrollSnapType = "none";
        container.dataset.phase = "animating";
        startVisualLoop();

        const startTime = performance.now();

        const tick = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / duration);
          const eased = easeOutQuart(progress);
          container.scrollLeft = start + delta * eased;

          if (progress < 1) {
            rafScrollRef.current = requestAnimationFrame(tick);
            return;
          }

          container.scrollLeft = target;
          container.style.scrollSnapType = "";
          container.dataset.phase = "idle";
          skipScrollSyncRef.current = false;
          animatingRef.current = false;
          rafScrollRef.current = null;
          setTrackIndexSafe(index);
          applyProximityStyles();
          stopVisualLoop();
          resolve(true);
        };

        rafScrollRef.current = requestAnimationFrame(tick);
      }),
    [
      applyProximityStyles,
      getScrollTarget,
      setTrackIndexSafe,
      startVisualLoop,
      stopVisualLoop,
    ]
  );

  const softSettleToNearest = useCallback(async () => {
    if (animatingRef.current || count <= 1) return;
    const nearest = getNearestTrackIndex();
    const target = getScrollTarget(nearest);
    const container = containerRef.current;
    if (!container || target === null) return;

    if (Math.abs(container.scrollLeft - target) > 2) {
      container.dataset.phase = "settling";
      await animateScrollTo(nearest, SETTLE_SCROLL_MS);
    } else {
      setTrackIndexSafe(nearest);
      applyProximityStyles();
    }

    normalizeLoopPosition();
    if (containerRef.current) containerRef.current.dataset.phase = "idle";
  }, [
    animateScrollTo,
    applyProximityStyles,
    count,
    getNearestTrackIndex,
    getScrollTarget,
    normalizeLoopPosition,
    setTrackIndexSafe,
  ]);

  /** Always works — uses ref so clicks never see a stale index; never permanently disables */
  const goBy = useCallback(
    async (direction: -1 | 1) => {
      if (count <= 1) return;

      // If a settle animation is mid-flight, cancel and take over
      if (rafScrollRef.current !== null) {
        cancelAnimationFrame(rafScrollRef.current);
        rafScrollRef.current = null;
      }
      animatingRef.current = false;
      skipScrollSyncRef.current = false;

      const current = getNearestTrackIndex();
      let next = current + direction;

      // Keep navigation inside the middle copy when possible for seamless looping
      if (canLoop) {
        if (next < count) next = next + count;
        if (next >= count * 2) next = next - count;
      } else {
        next = Math.max(0, Math.min(count - 1, next));
      }

      await animateScrollTo(next, ARROW_SCROLL_MS);
      normalizeLoopPosition();
    },
    [animateScrollTo, canLoop, count, getNearestTrackIndex, normalizeLoopPosition]
  );

  useEffect(() => {
    setTrackIndexSafe(middleStart);
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
  }, [safeDishes, middleStart, jumpToTrackIndex, setTrackIndexSafe]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || count <= 1) return;

    const scheduleSettle = () => {
      if (animatingRef.current) return;
      if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = window.setTimeout(() => {
        settleTimerRef.current = null;
        if (skipScrollSyncRef.current || animatingRef.current) return;
        stopVisualLoop();
        void softSettleToNearest();
      }, 110);
    };

    const onScroll = () => {
      if (skipScrollSyncRef.current) return;
      container.dataset.phase = "dragging";
      startVisualLoop();
      setTrackIndexSafe(getNearestTrackIndex());
      scheduleSettle();
    };

    const onScrollEnd = () => {
      if (skipScrollSyncRef.current || animatingRef.current) return;
      if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);
      stopVisualLoop();
      void softSettleToNearest();
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    container.addEventListener("scrollend", onScrollEnd);
    container.addEventListener("touchend", scheduleSettle, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      container.removeEventListener("scrollend", onScrollEnd);
      container.removeEventListener("touchend", scheduleSettle);
      if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);
      if (rafScrollRef.current !== null) cancelAnimationFrame(rafScrollRef.current);
      stopVisualLoop();
    };
  }, [
    count,
    getNearestTrackIndex,
    setTrackIndexSafe,
    softSettleToNearest,
    startVisualLoop,
    stopVisualLoop,
  ]);

  const measureActiveImage = useCallback(() => {
    const root = rootRef.current;
    const slide = slideRefs.current[trackIndexRef.current];
    if (!root || !slide) return;
    const img = slide.querySelector("[data-carousel-image]") as HTMLImageElement | null;
    if (!img) return;
    const rootRect = root.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    setArrowTop(imgRect.top - rootRect.top + imgRect.height / 2);
  }, []);

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

  return (
    <div ref={rootRef} data-carousel-root className="relative mx-auto w-full overflow-visible py-4">
      {/*
        Arrow rail is WIDER than the image so buttons sit in the peek gaps,
        not under the photo. Always clickable — never disabled.
      */}
      {showArrows ? (
        <div
          className="pointer-events-none absolute left-1/2 z-40 flex -translate-x-1/2 -translate-y-1/2 items-center justify-between"
          style={{ top: arrowTop, width: SLIDE_WIDTH_PX + 88 }}
        >
          <NavArrowButton direction="prev" onClick={() => void goBy(-1)} />
          <NavArrowButton direction="next" onClick={() => void goBy(1)} />
        </div>
      ) : null}

      <div
        ref={containerRef}
        data-phase="idle"
        className="menulia-carousel-track relative z-0 flex w-full snap-x snap-proximity items-center overflow-x-auto overscroll-x-contain touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                "menulia-carousel-slide flex shrink-0 snap-center flex-col items-center rounded-none origin-center will-change-[transform,opacity]",
                !isActive && "cursor-pointer"
              )}
              style={{ width: SLIDE_WIDTH_PX }}
              onClick={() => {
                if (isActive || animatingRef.current) return;
                void animateScrollTo(slot.trackIndex, ARROW_SCROLL_MS).then(() => {
                  normalizeLoopPosition();
                });
              }}
              onKeyDown={(event) => {
                if (isActive || event.key !== "Enter") return;
                void animateScrollTo(slot.trackIndex, ARROW_SCROLL_MS).then(() => {
                  normalizeLoopPosition();
                });
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
