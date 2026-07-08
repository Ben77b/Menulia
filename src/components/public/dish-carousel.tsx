"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { contrastingTextColor } from "@/lib/contrast";
import { usePreviewCanvas } from "@/contexts/preview-canvas-context";
import { pv } from "@/lib/preview-theme-vars";
import type { PublicMenuDisplayOptions } from "@/lib/display-options";
import type { PublicMenuLocale } from "@/lib/public-menu-i18n";
import { DishCard, type PublicMenuDish } from "./dish-card";

interface DishCarouselProps {
  dishes: PublicMenuDish[];
  lang: PublicMenuLocale;
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
  /**
   * When true, marks the first visible dish images as priority to improve
   * above-the-fold loading (especially while the splash screen is still up).
   */
  priority?: boolean;
}

const FOCUS_TRANSITION =
  "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.4s ease";

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
      className="origin-center will-change-transform"
      style={{
        transform: isActive ? "scale(1.02)" : "scale(1)",
        opacity: isActive ? 1 : 0.7,
        transition: FOCUS_TRANSITION,
      }}
    >
      {children}
    </div>
  );
}

export function DishCarousel({
  dishes,
  lang,
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
  priority = false,
}: DishCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const isPreview = usePreviewCanvas();
  const arrowColor = isPreview
    ? pv("carouselArrowIcon")
    : arrowIconColor ?? contrastingTextColor(accentColor);

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
    return (
      <p className="text-center text-sm" style={{ color: mainTextColor }}>
        {emptyMessage}
      </p>
    );
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

      {dishes.length === 1 ? (
        <div className="mx-auto w-full max-w-[320px]">
          <CarouselCardFrame isActive>
            <DishCard
              dish={dishes[0]}
              lang={lang}
              restaurantName={restaurantName}
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
              imageClassName="w-full"
              priority={priority}
            />
          </CarouselCardFrame>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-3 sm:gap-6">
          {slots.map((slot) => {
            const isActive = slot.position === "center";

            return (
              <div
                key={slot.key}
                className={
                  isActive
                    ? "w-[min(78vw,320px)] shrink-0"
                    : "hidden w-[min(34vw,200px)] shrink-0 sm:block"
                }
              >
                <CarouselCardFrame isActive={isActive}>
                  <DishCard
                    dish={slot.dish}
                    lang={lang}
                    restaurantName={restaurantName}
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
                    compact={!isActive}
                    imageClassName="w-full"
                    priority={priority && (isActive || slot.position !== "center")}
                  />
                </CarouselCardFrame>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
