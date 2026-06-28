"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { contrastingTextColor } from "@/lib/contrast";
import { DishCard, type PublicMenuDish } from "./dish-card";

interface DishCarouselProps {
  dishes: PublicMenuDish[];
  accentColor: string;
  mainTextColor: string;
  titleFont: string;
  bodyFont: string;
}

export function DishCarousel({
  dishes,
  accentColor,
  mainTextColor,
  titleFont,
  bodyFont,
}: DishCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const arrowColor = contrastingTextColor(accentColor);

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track || dishes.length === 0) return;

    const nextIndex = Math.max(0, Math.min(index, dishes.length - 1));
    const slide = track.children[nextIndex] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    setActiveIndex(nextIndex);
  }, [dishes.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || dishes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = Number((entry.target as HTMLElement).dataset.index);
          if (!Number.isNaN(index)) {
            setActiveIndex(index);
          }
        });
      },
      { root: track, threshold: 0.6 }
    );

    Array.from(track.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [dishes.length]);

  if (dishes.length === 0) {
    return <p className="text-sm opacity-70">No dishes in this category.</p>;
  }

  return (
    <div className="relative">
      {dishes.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous dish"
            onClick={() => scrollToIndex(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="absolute left-0 top-[calc(50%-2rem)] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full shadow-md transition-opacity disabled:opacity-30"
            style={{ backgroundColor: accentColor, color: arrowColor }}
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            aria-label="Next dish"
            onClick={() => scrollToIndex(activeIndex + 1)}
            disabled={activeIndex === dishes.length - 1}
            className="absolute right-0 top-[calc(50%-2rem)] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full shadow-md transition-opacity disabled:opacity-30"
            style={{ backgroundColor: accentColor, color: arrowColor }}
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </>
      )}

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-hidden scroll-smooth px-12 py-2"
      >
        {dishes.map((dish, index) => (
          <div
            key={dish.id}
            data-index={index}
            className="w-full min-w-full shrink-0 snap-center sm:min-w-[min(100%,320px)] sm:w-[min(100%,320px)]"
          >
            <DishCard
              dish={dish}
              titleFont={titleFont}
              bodyFont={bodyFont}
              textColor={mainTextColor}
              accentColor={accentColor}
              imageClassName="mx-auto w-full max-w-[320px]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
