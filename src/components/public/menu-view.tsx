"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import type { RestaurantFull, LanguageCode } from "@/lib/types";
import type { RestaurantDesign } from "@/lib/restaurant-design";
import { DIETARY_FILTERS } from "@/lib/dietary-tags";
import { cn } from "@/lib/utils";
import { MenuCarousel } from "./menu-carousel";
import { formatPrice } from "@/lib/utils";
import { ALLERGEN_ICONS } from "@/lib/types";

interface MenuViewProps {
  restaurant: RestaurantFull;
  language: LanguageCode;
  design: RestaurantDesign;
}

export function MenuView({ restaurant, language, design }: MenuViewProps) {
  const [categories, setCategories] = useState(restaurant.categories);
  const [activeCategory, setActiveCategory] = useState(
    restaurant.categories[0]?.id ?? ""
  );
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  // Load menu categories from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`menu-categories-${restaurant.id}`);
    if (saved) {
      try {
        const savedCategories = JSON.parse(saved);
        if (savedCategories.length > 0) {
          setCategories(savedCategories);
          setActiveCategory(savedCategories[0]?.id ?? "");
        }
      } catch (e) {
        console.error("Failed to load saved menu:", e);
      }
    }
  }, [restaurant.id]);

  // Listen for storage changes (for preview mode)
  useEffect(() => {
    const onStorage = () => {
      const saved = localStorage.getItem(`menu-categories-${restaurant.id}`);
      if (saved) {
        try {
          const savedCategories = JSON.parse(saved);
          if (savedCategories.length > 0) {
            setCategories(savedCategories);
            setActiveCategory(savedCategories[0]?.id ?? "");
          }
        } catch (e) {
          console.error("Failed to load saved menu:", e);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [restaurant.id]);

  const activeCat = categories.find((c) => c.id === activeCategory);

  const filteredItems = useMemo(() => {
    if (!activeCat) return [];
    return activeCat.items
      .filter((item: any) => {
        if (!item.is_available) return false;
        if (activeFilters.size === 0) return true;
        return [...activeFilters].every((f) => item.tags.includes(f));
      })
      .map((item: any) => {
        return {
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          image_url: item.image_url,
          allergens: item.allergens,
          tags: item.tags,
        };
      });
  }, [activeCat, activeFilters]);

  function toggleFilter(tag: string) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  return (
    <div className="flex flex-1 flex-col pt-20" style={{ backgroundColor: design.backgroundColor }}>
      {/* Header with title, slogan */}
      <div className="shrink-0 px-4 py-6 text-center" style={{ backgroundColor: design.headerColor }}>
        {design.restaurantName && (
          <h1 className="text-2xl font-bold text-center" style={{ color: design.titleColor, fontFamily: design.titleFont }}>
            {design.restaurantName}
          </h1>
        )}
        {design.slogan && (
          <p className="mt-1 text-sm text-center" style={{ color: design.textColor, fontFamily: design.textFont }}>
            {design.slogan}
          </p>
        )}
      </div>

      {/* Category bar - centered, wraps naturally */}
      <div className="flex shrink-0 justify-center gap-2 flex-wrap px-4 py-3" style={{ backgroundColor: design.headerColor }}>
        {categories.map((cat: any) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-all shadow-sm hover:shadow-md",
              activeCategory === cat.id ? "" : "bg-white"
            )}
            style={
              activeCategory === cat.id
                ? { backgroundColor: design.categoryColor, color: design.categoryTextColor }
                : { color: design.categoryTextColor }
            }
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu content - carousel or stacked based on design */}
      {design.menuViewMode === "carousel" ? (
        <div className="py-7">
          <MenuCarousel items={filteredItems} design={design} />
        </div>
      ) : (
        <div className="flex-1 px-4 py-4 space-y-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-border bg-white p-4 shadow-sm"
            >
              <div className="flex gap-4">
                {item.image_url && (
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold" style={{ color: design.titleColor, fontFamily: design.titleFont }}>{item.name}</h3>
                  <p className="mt-1 text-sm line-clamp-2" style={{ color: design.textColor, fontFamily: design.textFont }}>
                    {item.description}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className="font-bold"
                      style={{ color: design.priceColor }}
                    >
                      {formatPrice(item.price)}
                    </span>
                    {item.tags.length > 0 && (
                      <div className="flex gap-1">
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
                  </div>
                  {item.allergens.length > 0 && (
                    <div className="mt-2 flex gap-1">
                      {item.allergens.map((a: string) => (
                        <span key={a} className="text-xs" title={a}>
                          {ALLERGEN_ICONS[a] ?? "⚠️"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <p className="text-center text-sm" style={{ color: design.textColor }}>
              No dishes match your filters.
            </p>
          )}
        </div>
      )}

      {/* Dietary filter icons — bottom, compact */}
      <div className="flex shrink-0 items-center justify-center gap-2 border-t border-border/50 px-4 py-4" style={{ backgroundColor: design.footerColor }}>
        {DIETARY_FILTERS.map((filter) => {
          const active = activeFilters.has(filter.tag);
          return (
            <button
              key={filter.tag}
              onClick={() => toggleFilter(filter.tag)}
              title={filter.label}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl text-xl transition-all",
                active ? "scale-110 shadow-md" : "bg-white shadow-sm opacity-70 hover:opacity-100"
              )}
              style={
                active
                  ? { backgroundColor: `${design.buttonColor}22`, outline: `2px solid ${design.buttonColor}` }
                  : undefined
              }
            >
              {filter.icon}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="shrink-0 px-6 py-12" style={{ backgroundColor: design.footerColor }}>
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Logo - Creative centered design */}
          {design.showFooterLogo && design.logo && (
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-full opacity-10" style={{ backgroundColor: design.accentColor, transform: 'scale(1.2)' }}></div>
                <img
                  src={design.logo}
                  alt={design.restaurantName || restaurant.name}
                  className="relative h-16 w-auto object-contain"
                />
              </div>
              <h2
                className="text-2xl font-bold"
                style={{ color: design.titleColor, fontFamily: design.titleFont }}
              >
                {design.restaurantName || restaurant.name}
              </h2>
              {design.slogan && (
                <p
                  className="text-sm italic"
                  style={{ color: design.textColor, fontFamily: design.textFont }}
                >
                  {design.slogan}
                </p>
              )}
            </div>
          )}

          {/* Social Links - Same as header */}
          {design.showFooterLinks && (restaurant.website_url || restaurant.instagram_url || restaurant.facebook_url || restaurant.custom_links.length > 0) && (
            <div className="flex flex-col items-center space-y-4">
              <div className="flex justify-center gap-4">
                {restaurant.website_url && (
                  <a
                    href={restaurant.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 w-12 items-center justify-center rounded-full border-2 hover:scale-110 transition-all"
                    style={{ borderColor: design.accentColor, color: design.accentColor }}
                    aria-label="Website"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </a>
                )}
                {restaurant.instagram_url && (
                  <a
                    href={restaurant.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 w-12 items-center justify-center rounded-full border-2 hover:scale-110 transition-all"
                    style={{ borderColor: design.accentColor, color: design.accentColor }}
                    aria-label="Instagram"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm0 18c-4.554 0-8.25-3.696-8.25-8.25S7.446 3.75 12 3.75s8.25 3.696 8.25 8.25-3.696 8.25-8.25 8.25z" />
                    </svg>
                  </a>
                )}
                {restaurant.facebook_url && (
                  <a
                    href={restaurant.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 w-12 items-center justify-center rounded-full border-2 hover:scale-110 transition-all"
                    style={{ borderColor: design.accentColor, color: design.accentColor }}
                    aria-label="Facebook"
                  >
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}
              </div>
              {restaurant.custom_links.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3">
                  {restaurant.custom_links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:opacity-80 transition-opacity underline"
                      style={{ color: design.accentColor, fontFamily: design.textFont }}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contact Info & Hours - Creative grid layout */}
          {(design.showFooterContact || design.showFooterHours) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {design.showFooterContact && (restaurant.phone || restaurant.email || design.location || design.contactInfo) && (
                <div className="flex flex-col items-center space-y-3 p-4 rounded-2xl" style={{ backgroundColor: `${design.accentColor}08` }}>
                  <h3 className="font-bold text-center" style={{ color: design.titleColor, fontFamily: design.titleFont }}>Contact</h3>
                  {design.location && (
                    <p className="text-sm text-center" style={{ color: design.textColor, fontFamily: design.textFont }}>
                      {design.location}
                    </p>
                  )}
                  {restaurant.phone && (
                    <a
                      href={`tel:${restaurant.phone}`}
                      className="text-sm text-center hover:opacity-80 transition-opacity"
                      style={{ color: design.accentColor, fontFamily: design.textFont }}
                    >
                      {restaurant.phone}
                    </a>
                  )}
                  {restaurant.email && (
                    <a
                      href={`mailto:${restaurant.email}`}
                      className="text-sm text-center hover:opacity-80 transition-opacity"
                      style={{ color: design.accentColor, fontFamily: design.textFont }}
                    >
                      {restaurant.email}
                    </a>
                  )}
                  {design.contactInfo && (
                    <p className="text-sm text-center" style={{ color: design.textColor, fontFamily: design.textFont }}>
                      {design.contactInfo}
                    </p>
                  )}
                </div>
              )}
              {design.showFooterHours && restaurant.operating_hours && restaurant.operating_hours.length > 0 && (
                <div className="flex flex-col items-center space-y-3 p-4 rounded-2xl text-center" style={{ backgroundColor: `${design.accentColor}08` }}>
                  <h3 className="font-bold" style={{ color: design.titleColor, fontFamily: design.titleFont }}>Hours</h3>
                  <div className="space-y-2">
                    {restaurant.operating_hours.map((hour) => (
                      <div key={hour.id} className="text-sm" style={{ color: design.textColor, fontFamily: design.textFont }}>
                        <span className="font-medium">
                          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][hour.day_of_week]}
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          {hour.is_closed ? "Closed" : `${hour.open_time} - ${hour.close_time}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Food Tags Cloud - Creative pill design */}
          {design.showFooterTags && (() => {
            const allTags = new Set<string>();
            categories.forEach((cat) => {
              cat.items.forEach((item) => {
                item.tags.forEach((tag) => allTags.add(tag));
              });
            });
            const tagsArray = Array.from(allTags);
            if (tagsArray.length === 0) return null;
            return (
              <div className="flex flex-col items-center space-y-3">
                <h3 className="font-bold text-center" style={{ color: design.titleColor, fontFamily: design.titleFont }}>Menu Tags</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {tagsArray.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full px-4 py-2 text-xs font-medium border hover:scale-105 transition-transform"
                      style={{
                        backgroundColor: `${design.accentColor}12`,
                        color: design.accentColor,
                        borderColor: design.accentColor,
                        fontFamily: design.textFont,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </footer>
    </div>
  );
}
