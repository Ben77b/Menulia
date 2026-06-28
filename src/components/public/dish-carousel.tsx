"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { contrastingTextColor } from "@/lib/contrast";
import { DishCard, type PublicMenuDish } from "./dish-card";

interface DishCarouselProps {
  dishes: PublicMenuDish[];
  accentColor: string;
  mainTextColor: string;
  titleFont: string;
  bodyFont: string;
  emptyMessage?: string;
}

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

export function DishCarousel({
  dishes,
  accentColor,
  mainTextColor,
  titleFont,
  bodyFont,
  emptyMessage = "No dishes in this category.",
}: DishCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const arrowColor = contrastingTextColor(accentColor);

  useEffect(() => {
    setActiveIndex(0);
  }, [dishes]);

  const slots = useMemo(() => {
    if (dishes.length === 0) return [];
    if (dishes.length === 1) {
      return [{ dish: dishes[0], position: "center" as const, key: dishes[0].id }];
    }

    const prevIndex = mod(activeIndex - 1, dishes.length);
    const nextIndex = mod(activeIndex + 1, dishes.length);

    return [
      { dish: dishes[prevIndex], position: "left" as const, key: `${dishes[prevIndex].id}-left` },
      { dish: dishes[activeIndex], position: "center" as const, key: `${dishes[activeIndex].id}-center` },
      { dish: dishes[nextIndex], position: "right" as const, key: `${dishes[nextIndex].id}-right` },
    ];
  }, [activeIndex, dishes]);

  if (dishes.length === 0) {
    return <p className="text-center text-sm" style={{ color: mainTextColor }}>{emptyMessage}</p>;
  }

  function goPrevious() {
    setActiveIndex((current) => mod(current - 1, dishes.length));
  }

  function goNext() {
    setActiveIndex((current) => mod(current + 1, dishes.length));
  }

  return (
    <div className="relative mx-auto max-w-4xl px-10 py-4 sm:px-14">
      {dishes.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous dish"
            onClick={goPrevious}
            className="absolute left-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full shadow-md transition-transform hover:scale-105"
            style={{ backgroundColor: accentColor, color: arrowColor }}
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            aria-label="Next dish"
            onClick={goNext}
            className="absolute right-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full shadow-md transition-transform hover:scale-105"
            style={{ backgroundColor: accentColor, color: arrowColor }}
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </>
      )}

      {dishes.length === 1 ? (
        <div className="mx-auto w-full max-w-[320px]">
          <DishCard
            dish={dishes[0]}
            titleFont={titleFont}
            bodyFont={bodyFont}
            textColor={mainTextColor}
            layout="carousel"
            imageClassName="w-full"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center gap-3 sm:gap-6">
          {slots.map((slot) => (
            <div
              key={slot.key}
              className={`shrink-0 transition-all duration-500 ease-out ${
                slot.position === "center"
                  ? "w-[min(78vw,320px)] scale-100 opacity-100"
                  : "hidden w-[min(34vw,200px)] scale-[0.82] opacity-55 sm:block"
              }`}
            >
              <DishCard
                dish={slot.dish}
                titleFont={titleFont}
                bodyFont={bodyFont}
                textColor={mainTextColor}
                layout="carousel"
                compact={slot.position !== "center"}
                imageClassName="w-full"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
