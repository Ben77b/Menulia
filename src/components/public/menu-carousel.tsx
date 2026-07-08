"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { ALLERGEN_ICONS } from "@/lib/types";
import { DIETARY_FILTERS } from "@/lib/dietary-tags";
import type { RestaurantDesign } from "@/lib/restaurant-design";

interface CarouselItem {
  id: string;
  name: string;
  description: string;
  price: number;
  hide_price?: boolean;
  image_url: string | null;
  allergens: string[];
  tags: string[];
}

interface MenuCarouselProps {
  items: CarouselItem[];
  design: RestaurantDesign;
}

export function MenuCarousel({ items, design }: MenuCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(items.length);
  const [isTransitioning, setIsTransitioning] = useState(false);

  function handleNext() {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  }

  function handlePrev() {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  }

  // Seamless infinite loop reset
  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => {
        if (currentIndex >= items.length * 2) {
          setCurrentIndex(items.length);
        } else if (currentIndex < items.length) {
          setCurrentIndex(items.length + (currentIndex % items.length));
        }
        setIsTransitioning(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isTransitioning, items.length]);

  if (items.length === 0) {
    return (
      <p className="flex flex-1 items-center justify-center text-sm text-text-secondary">
        No dishes match your filters.
      </p>
    );
  }

  // Create extended items for infinite loop visual (5x for buffer)
  const extendedItems = [...items, ...items, ...items, ...items, ...items];

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden">
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/95 shadow-lg transition hover:scale-105"
        aria-label="Previous dish"
      >
        <ChevronLeft className="h-6 w-6" style={{ color: design.priceColor }} />
      </button>

      <div className="w-full max-w-2xl overflow-hidden px-16">
        <div 
          className={`flex flex-row nowrap items-stretch ${isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''}`}
          style={{ transform: `translateX(calc(-${currentIndex * 352}px + 50% - 160px))` }}
        >
          {extendedItems.map((item, index) => {
            const distanceFromCenter = Math.abs(index - currentIndex);
            const isActive = distanceFromCenter === 0;
            const isAdjacent = distanceFromCenter === 1;
            
            return (
              <article
                key={`${item.id}-${index}`}
                className={`
                  flex shrink-0 flex-col w-80 mr-8 transition-all duration-500 ease-in-out
                  ${isActive ? 'scale-100 opacity-100' : isAdjacent ? 'scale-75 opacity-50' : 'scale-50 opacity-20'}
                `}
              >
                <div className="relative aspect-square w-full shrink-0 bg-transparent rounded-2xl overflow-hidden">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="320px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl bg-muted rounded-2xl">🍽️</div>
                  )}
                </div>
                
                <div className="flex flex-col px-2 py-3 text-center">
                  <h3 className="font-semibold leading-tight" style={{ color: design.titleColor, fontFamily: design.titleFont }}>
                    {item.name}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed line-clamp-2" style={{ color: design.textColor, fontFamily: design.textFont }}>
                    {item.description}
                  </p>
                  <span
                    className="mt-1 font-bold text-sm"
                    style={{ color: design.priceColor }}
                  >
                    {!item.hide_price && formatPrice(item.price)}
                  </span>
                  {isActive && item.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                      {item.tags.map((tag: string) => {
                        const filter = DIETARY_FILTERS.find((f) => f.tag === tag);
                        if (!filter) return null;
                        return (
                          <span
                            key={tag}
                            className="flex items-center gap-1 rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-medium"
                          >
                            <span className="text-xs">{filter.icon}</span>
                            {filter.label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {isActive && item.allergens.length > 0 && (
                    <div className="mt-1 flex justify-center gap-0.5">
                      {item.allergens.map((a: string) => (
                        <span key={a} className="text-xs" title={a}>
                          {ALLERGEN_ICONS[a] ?? "⚠️"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/95 shadow-lg transition hover:scale-105"
        aria-label="Next dish"
      >
        <ChevronRight className="h-6 w-6" style={{ color: design.priceColor }} />
      </button>

      <div className="flex justify-center gap-2 py-2">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              if (!isTransitioning) {
                setIsTransitioning(true);
                setCurrentIndex(items.length + i);
              }
            }}
            className={`h-2 rounded-full transition-all ${
              (currentIndex % items.length) === i ? "w-8" : "w-2 bg-border"
            }`}
            style={(currentIndex % items.length) === i ? { backgroundColor: design.priceColor } : undefined}
            aria-label={`Go to dish ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
