"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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
  fontClasses?: { heading: string; body: string };
}

export function MenuView({ restaurant, language, design, fontClasses }: MenuViewProps) {
  const [categories, setCategories] = useState(restaurant.categories);
  const [activeCategory, setActiveCategory] = useState(
    restaurant.categories[0]?.id ?? ""
  );
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const categoryRefs = useRef<Record<string, HTMLElement>>({});

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

  // Intersection observer for active category highlighting
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const categoryId = entry.target.id.replace("category-", "");
            setActiveCategory(categoryId);
          }
        });
      },
      { threshold: 0.5, rootMargin: "-20% 0px -70% 0px" }
    );

    categories.forEach((cat) => {
      const element = categoryRefs.current[cat.id];
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [categories]);

  const filteredCategories = useMemo(() => {
    return categories.map((cat) => ({
      ...cat,
      items: cat.items
        .filter((item: any) => {
          if (!item.is_available) return false;
          if (activeFilters.size === 0) return true;
          return [...activeFilters].every((f) => item.tags.includes(f));
        })
        .map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          image_url: item.image_url,
          allergens: item.allergens,
          tags: item.tags,
        })),
    }));
  }, [categories, activeFilters]);

  function scrollToCategory(categoryId: string) {
    const element = categoryRefs.current[categoryId];
    if (element) {
      const offset = 80; // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveCategory(categoryId);
    }
  }

  function toggleFilter(tag: string) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  return (
    <div className={`flex flex-1 flex-col ${fontClasses?.body || ''}`} style={{ backgroundColor: design.mainContentBackgroundColor }}>
      {/* Header with title, slogan */}
      <div className="shrink-0 px-4 py-6 text-center" style={{ backgroundColor: design.headerFooterBackgroundColor }}>
        {design.restaurantName && (
          <h1 className={`text-2xl font-bold text-center ${fontClasses?.heading || ''}`} style={{ color: design.headerFooterFontColor }}>
            {design.restaurantName}
          </h1>
        )}
        {design.slogan && (
          <p className={`mt-1 text-sm text-center ${fontClasses?.body || ''}`} style={{ color: design.headerFooterFontColor }}>
            {design.slogan}
          </p>
        )}
      </div>

      {/* Sticky category navigation bar */}
      <div className="sticky top-24 z-10 shrink-0 border-b border-border/20" style={{ backgroundColor: design.categoryBackgroundColor }}>
        <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
          {categories.length === 0 ? (
            <span className="whitespace-nowrap px-4 py-2 text-sm text-gray-500">Menu</span>
          ) : (
          categories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all shadow-sm hover:shadow-md",
                activeCategory === cat.id ? "" : "bg-white"
              )}
              style={
                activeCategory === cat.id
                  ? { backgroundColor: design.buttonColor, color: "#ffffff" }
                  : { color: design.categoryFontColor }
              }
            >
              {cat.name}
            </button>
          ))
          )}
        </div>
      </div>

      {/* Menu content - scrollable layout with all categories */}
      <div className="flex-1 px-4 py-4 space-y-8">
        {categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-white/80 px-6 py-12 text-center">
            <p className={`text-lg font-semibold ${fontClasses?.heading || ""}`} style={{ color: design.mainContentFontColor }}>
              Menu coming soon!
            </p>
            <p className={`mt-2 text-sm ${fontClasses?.body || ""}`} style={{ color: design.mainContentFontColor }}>
              This restaurant hasn&apos;t added any dishes yet.
            </p>
          </div>
        ) : (
        filteredCategories.map((cat) => (
          <div
            key={cat.id}
            id={`category-${cat.id}`}
            ref={(el) => { if (el) categoryRefs.current[cat.id] = el; }}
            className="scroll-mt-24"
          >
            <h2 className={`mb-4 text-xl font-bold ${fontClasses?.heading || ''}`} style={{ color: design.mainContentFontColor }}>
              {cat.name}
            </h2>

            {cat.layout_type === 'carousel' ? (
              <div className="py-4">
                <MenuCarousel items={cat.items} design={design} />
              </div>
            ) : (
              <div className="space-y-4">
                {cat.items.map((item) => (
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
                        <h3 className={`font-semibold ${fontClasses?.heading || ''}`} style={{ color: design.mainContentFontColor }}>{item.name}</h3>
                        <p className={`mt-1 text-sm line-clamp-2 ${fontClasses?.body || ''}`} style={{ color: design.mainContentFontColor }}>
                          {item.description}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span
                            className={`font-bold ${fontClasses?.body || ''}`}
                            style={{ color: design.buttonColor }}
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
                                    className={`flex items-center gap-1 rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-medium ${fontClasses?.body || ''}`}
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
                {cat.items.length === 0 && (
                  <p className={`text-center text-sm ${fontClasses?.body || ''}`} style={{ color: design.mainContentFontColor }}>
                    No dishes in this category.
                  </p>
                )}
              </div>
            )}
          </div>
        ))
        )}
      </div>

      {/* Dietary filter icons — bottom, compact */}
      <div className="flex shrink-0 items-center justify-center gap-2 border-t border-border/50 px-4 py-4" style={{ backgroundColor: design.headerFooterBackgroundColor }}>
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
      <footer className="shrink-0 px-6 py-12" style={{ backgroundColor: design.headerFooterBackgroundColor }}>
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Logo - Creative centered design */}
          {design.showFooterLogo && design.logo && (
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-full opacity-10" style={{ backgroundColor: design.buttonColor, transform: 'scale(1.2)' }}></div>
                <img
                  src={design.logo}
                  alt={design.restaurantName || restaurant.name}
                  className="relative h-16 w-auto object-contain"
                />
              </div>
              <h2
                className={`text-2xl font-bold ${fontClasses?.heading || ''}`}
                style={{ color: design.headerFooterFontColor }}
              >
                {design.restaurantName || restaurant.name}
              </h2>
              {design.slogan && (
                <p
                  className={`text-sm italic ${fontClasses?.body || ''}`}
                  style={{ color: design.headerFooterFontColor }}
                >
                  {design.slogan}
                </p>
              )}
            </div>
          )}

          {/* Social Links - Using custom_links */}
          {design.showFooterLinks && restaurant.custom_links.length > 0 && (
            <div className="flex flex-col items-center space-y-4">
              <div className="flex flex-wrap justify-center gap-3">
                {restaurant.custom_links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-sm font-medium hover:opacity-80 transition-opacity underline ${fontClasses?.body || ''}`}
                    style={{ color: design.buttonColor }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Contact Info & Hours - Creative grid layout */}
          {(design.showFooterContact || design.showFooterHours) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {design.showFooterContact && (restaurant.phone || restaurant.email || design.location || design.contactInfo) && (
                <div className="flex flex-col items-center space-y-3 p-4 rounded-2xl" style={{ backgroundColor: `${design.buttonColor}08` }}>
                  <h3 className={`font-bold text-center ${fontClasses?.heading || ''}`} style={{ color: design.headerFooterFontColor }}>Contact</h3>
                  {design.location && (
                    <p className={`text-sm text-center ${fontClasses?.body || ''}`} style={{ color: design.headerFooterFontColor }}>
                      {design.location}
                    </p>
                  )}
                  {restaurant.phone && (
                    <a
                      href={`tel:${restaurant.phone}`}
                      className={`text-sm text-center hover:opacity-80 transition-opacity ${fontClasses?.body || ''}`}
                      style={{ color: design.buttonColor }}
                    >
                      {restaurant.phone}
                    </a>
                  )}
                  {restaurant.email && (
                    <a
                      href={`mailto:${restaurant.email}`}
                      className={`text-sm text-center hover:opacity-80 transition-opacity ${fontClasses?.body || ''}`}
                      style={{ color: design.buttonColor }}
                    >
                      {restaurant.email}
                    </a>
                  )}
                  {design.contactInfo && (
                    <p className={`text-sm text-center ${fontClasses?.body || ''}`} style={{ color: design.headerFooterFontColor }}>
                      {design.contactInfo}
                    </p>
                  )}
                </div>
              )}
              {design.showFooterHours && restaurant.operating_hours && restaurant.operating_hours.length > 0 && (
                <div className="flex flex-col items-center space-y-3 p-4 rounded-2xl text-center" style={{ backgroundColor: `${design.buttonColor}08` }}>
                  <h3 className={`font-bold ${fontClasses?.heading || ''}`} style={{ color: design.headerFooterFontColor }}>Hours</h3>
                  <div className="space-y-2">
                    {restaurant.operating_hours.map((hour, index) => (
                      <div key={index} className={`text-sm ${fontClasses?.body || ''}`} style={{ color: design.headerFooterFontColor }}>
                        <span className="font-medium">
                          {hour.day}
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          {!hour.isOpen ? "Closed" : `${hour.startTime} - ${hour.endTime}`}
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
                <h3 className={`font-bold text-center ${fontClasses?.heading || ''}`} style={{ color: design.headerFooterFontColor }}>Menu Tags</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {tagsArray.map((tag) => (
                    <span
                      key={tag}
                      className={`rounded-full px-4 py-2 text-xs font-medium border hover:scale-105 transition-transform ${fontClasses?.body || ''}`}
                      style={{
                        backgroundColor: `${design.buttonColor}12`,
                        color: design.buttonColor,
                        borderColor: design.buttonColor,
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
