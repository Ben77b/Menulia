"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import { ALLERGEN_ICONS } from "@/lib/types";
import { DIETARY_FILTERS } from "@/lib/dietary-tags";
import type { RestaurantDesign } from "@/lib/restaurant-design";
import { radiusClass } from "@/lib/restaurant-design";

interface CarouselItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  allergens: string[];
  tags: string[];
}

interface MenuCarouselProps {
  items: CarouselItem[];
  design: RestaurantDesign;
}

export function MenuCarousel({ items, design }: MenuCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function scrollTo(index: number) {
    const el = scrollRef.current;
    if (!el || items.length === 0) return;
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    const card = el.children[clamped] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    setActiveIndex(clamped);
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const cards = Array.from(el.children) as HTMLElement[];
      const center = el.scrollLeft + el.clientWidth / 2;
      let closest = 0;
      let minDist = Infinity;
      cards.forEach((card, i) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const dist = Math.abs(center - cardCenter);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      });
      setActiveIndex(closest);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [items.length]);

  if (items.length === 0) {
    return (
      <p className="flex flex-1 items-center justify-center text-sm text-text-secondary">
        No dishes match your filters.
      </p>
    );
  }

  const r = radiusClass(design);

  return (
    <div className="relative flex flex-1 flex-col min-h-0">
      <button
        onClick={() => scrollTo(activeIndex - 1)}
        disabled={activeIndex === 0}
        className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-md transition hover:scale-105 disabled:opacity-30"
        aria-label="Previous dish"
      >
        <ChevronLeft className="h-5 w-5" style={{ color: design.accentColor }} />
      </button>

      <div
        ref={scrollRef}
        className="scrollbar-hide flex flex-1 snap-x snap-mandatory items-stretch gap-4 overflow-x-auto px-12 py-2"
      >
        {items.map((item) => (
          <article
            key={item.id}
            className={cn(
              "flex w-[85vw] max-w-sm shrink-0 snap-center flex-col overflow-hidden bg-white shadow-md",
              r
            )}
          >
            <div className="relative h-48 w-full shrink-0 bg-muted">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="85vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-4xl">🍽️</div>
              )}
            </div>
            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold leading-tight">{item.name}</h3>
                <span
                  className="shrink-0 text-lg font-bold"
                  style={{ color: design.accentColor }}
                >
                  {formatPrice(item.price)}
                </span>
              </div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-text-secondary">
                {item.description}
              </p>
              {item.allergens.length > 0 && (
                <div className="mt-3 flex gap-1">
                  {item.allergens.map((a) => (
                    <span key={a} className="text-base" title={a}>
                      {ALLERGEN_ICONS[a] ?? "⚠️"}
                    </span>
                  ))}
                </div>
              )}
              {item.tags.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {item.tags.map((tag) => {
                    const filter = DIETARY_FILTERS.find((f) => f.tag === tag);
                    if (!filter) return null;
                    return (
                      <span key={tag} className="text-xl" title={filter.label}>
                        {filter.icon}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      <button
        onClick={() => scrollTo(activeIndex + 1)}
        disabled={activeIndex === items.length - 1}
        className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-md transition hover:scale-105 disabled:opacity-30"
        aria-label="Next dish"
      >
        <ChevronRight className="h-5 w-5" style={{ color: design.accentColor }} />
      </button>

      <div className="flex justify-center gap-1.5 py-2">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === activeIndex ? "w-6" : "w-1.5 bg-border"
            )}
            style={i === activeIndex ? { backgroundColor: design.accentColor } : undefined}
            aria-label={`Go to dish ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
