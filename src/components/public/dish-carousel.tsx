"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { contrastingTextColor } from "@/lib/contrast";
import { usePreviewCanvas } from "@/contexts/preview-canvas-context";
import { pv } from "@/lib/preview-theme-vars";
import type { PublicMenuDisplayOptions } from "@/lib/display-options";
import { DishCard, type PublicMenuDish } from "./dish-card";

interface DishCarouselProps {
  dishes: PublicMenuDish[];
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

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

export function DishCarousel({
  dishes,
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
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const isPreview = usePreviewCanvas();
  const arrowColor = isPreview
    ? pv("carouselArrowIcon")
    : arrowIconColor ?? contrastingTextColor(accentColor);

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    slideRefs.current[index]?.scrollIntoView({
      behavior,
      inline: "center",
      block: "nearest",
    });
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
    slideRefs.current = [];
    requestAnimationFrame(() => {
      scrollToIndex(0, "instant");
    });
  }, [dishes, scrollToIndex]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || dishes.length <= 1) return;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const center = el.scrollLeft + el.clientWidth / 2;
        let closest = 0;
        let minDistance = Number.POSITIVE_INFINITY;

        slideRefs.current.forEach((slide, index) => {
          if (!slide) return;
          const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
          const distance = Math.abs(center - slideCenter);
          if (distance < minDistance) {
            minDistance = distance;
            closest = index;
          }
        });

        setActiveIndex(closest);
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [dishes.length]);

  if (dishes.length === 0) {
    return (
      <p className="text-center text-sm" style={{ color: mainTextColor }}>
        {emptyMessage}
      </p>
    );
  }

  function goPrevious() {
    scrollToIndex(mod(activeIndex - 1, dishes.length));
  }

  function goNext() {
    scrollToIndex(mod(activeIndex + 1, dishes.length));
  }

  return (
    <div className="relative mx-auto max-w-4xl px-10 py-4 sm:px-14">
      {dishes.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous dish"
            onClick={goPrevious}
            className="absolute left-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full shadow-md transition-transform duration-200 ease-in-out hover:scale-105"
            style={{ backgroundColor: accentColor, color: arrowColor }}
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            aria-label="Next dish"
            onClick={goNext}
            className="absolute right-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full shadow-md transition-transform duration-200 ease-in-out hover:scale-105"
            style={{ backgroundColor: accentColor, color: arrowColor }}
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </>
      )}

      <div
        ref={scrollerRef}
        className="air-carousel-track flex gap-5 overflow-x-auto px-[max(0.5rem,calc(50%-min(39vw,160px)))] pb-2 scrollbar-hide sm:gap-6"
      >
        {dishes.map((dish, index) => (
          <div
            key={dish.id}
            ref={(node) => {
              slideRefs.current[index] = node;
            }}
            className="w-[min(78vw,320px)] shrink-0 snap-center snap-always transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              opacity: index === activeIndex ? 1 : 0.5,
              transform: index === activeIndex ? "scale(1)" : "scale(0.94)",
            }}
          >
            <DishCard
              dish={dish}
              titleFont={titleFont}
              bodyFont={bodyFont}
              titleFontWeight={titleFontWeight}
              titleFontStyle={titleFontStyle}
              bodyFontWeight={bodyFontWeight}
              bodyFontStyle={bodyFontStyle}
              textColor={mainTextColor}
              display={display}
              titleColor={titleColor}
              descriptionColor={descriptionColor}
              priceColor={priceColor}
              layout="carousel"
              compact={index !== activeIndex}
              imageClassName="w-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
