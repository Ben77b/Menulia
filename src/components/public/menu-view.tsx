"use client";

import { useState, useMemo } from "react";
import type { RestaurantFull, LanguageCode } from "@/lib/types";
import type { RestaurantDesign } from "@/lib/restaurant-design";
import { DIETARY_FILTERS } from "@/lib/dietary-tags";
import { cn } from "@/lib/utils";
import { MenuCarousel } from "./menu-carousel";

interface MenuViewProps {
  restaurant: RestaurantFull;
  language: LanguageCode;
  design: RestaurantDesign;
}

export function MenuView({ restaurant, language, design }: MenuViewProps) {
  const [activeCategory, setActiveCategory] = useState(
    restaurant.categories[0]?.id ?? ""
  );
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  const activeCat = restaurant.categories.find((c) => c.id === activeCategory);

  const filteredItems = useMemo(() => {
    if (!activeCat) return [];
    return activeCat.items
      .filter((item) => {
        if (!item.is_available) return false;
        if (activeFilters.size === 0) return true;
        return [...activeFilters].every((f) => item.tags.includes(f));
      })
      .map((item) => {
        const translation = item.translations.find((t) => t.language_code === language);
        return {
          id: item.id,
          name: translation?.translated_name ?? item.name,
          description: translation?.translated_description ?? item.description,
          price: item.price,
          image_url: item.image_url,
          allergens: item.allergens,
          tags: item.tags,
        };
      });
  }, [activeCat, activeFilters, language]);

  function toggleFilter(tag: string) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Category bar */}
      <div className="scrollbar-hide flex shrink-0 gap-2 overflow-x-auto px-4 py-2">
        {restaurant.categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all",
              activeCategory === cat.id
                ? "text-white shadow-sm"
                : "bg-white text-text-secondary shadow-sm hover:shadow-md"
            )}
            style={
              activeCategory === cat.id
                ? { backgroundColor: design.accentColor }
                : undefined
            }
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Dish carousel */}
      <MenuCarousel items={filteredItems} design={design} />

      {/* Dietary filter icons — bottom */}
      <div className="flex shrink-0 items-center justify-center gap-4 border-t border-border/50 px-4 py-3">
        {DIETARY_FILTERS.map((filter) => {
          const active = activeFilters.has(filter.tag);
          return (
            <button
              key={filter.tag}
              onClick={() => toggleFilter(filter.tag)}
              title={filter.label}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition-all",
                active ? "scale-110 shadow-md" : "bg-white shadow-sm opacity-70 hover:opacity-100"
              )}
              style={
                active
                  ? { backgroundColor: `${design.accentColor}22`, outline: `2px solid ${design.accentColor}` }
                  : undefined
              }
            >
              {filter.icon}
            </button>
          );
        })}
      </div>
    </div>
  );
}
