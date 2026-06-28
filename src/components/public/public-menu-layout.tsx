"use client";

import { useEffect, useMemo, useState } from "react";
import { contrastingTextColor } from "@/lib/contrast";
import type { MenuThemeColors } from "@/lib/theme-colors";
import type { PublicMenuParentCategory } from "@/lib/menu-hierarchy";
import type { RestaurantLink } from "@/lib/restaurant-links";
import { MenuHeader } from "./menu-header";
import { NestedCategoryNav } from "./nested-category-nav";
import { DishCarousel } from "./dish-carousel";
import { DishCard } from "./dish-card";

interface PublicMenuLayoutProps {
  restaurantName: string;
  logo: string | null;
  location: string;
  hours: string;
  contactInfo: string;
  theme: MenuThemeColors;
  titleFont: string;
  bodyFont: string;
  menu: PublicMenuParentCategory[];
  links: RestaurantLink[];
}

export function PublicMenuLayout({
  restaurantName,
  logo,
  location,
  hours,
  contactInfo,
  theme,
  titleFont,
  bodyFont,
  menu,
  links,
}: PublicMenuLayoutProps) {
  const [activeParentId, setActiveParentId] = useState(menu[0]?.id ?? "");
  const [activeSubcategoryId, setActiveSubcategoryId] = useState(
    menu[0]?.subcategories[0]?.id ?? ""
  );

  useEffect(() => {
    if (menu.length === 0) return;
    if (!menu.some((parent) => parent.id === activeParentId)) {
      setActiveParentId(menu[0].id);
      setActiveSubcategoryId(menu[0].subcategories[0]?.id ?? "");
    }
  }, [menu, activeParentId]);

  const activeSubcategory = useMemo(() => {
    const parent = menu.find((item) => item.id === activeParentId) ?? menu[0];
    return (
      parent?.subcategories.find((sub) => sub.id === activeSubcategoryId) ??
      parent?.subcategories[0]
    );
  }, [menu, activeParentId, activeSubcategoryId]);

  const mainTextColor = contrastingTextColor(theme.mainContentBackgroundColor);
  const footerTextColor = contrastingTextColor(theme.footerBackgroundColor);

  function handleParentChange(parentId: string) {
    setActiveParentId(parentId);
    const parent = menu.find((item) => item.id === parentId);
    if (parent?.subcategories[0]) {
      setActiveSubcategoryId(parent.subcategories[0].id);
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: theme.mainContentBackgroundColor, fontFamily: bodyFont }}
    >
      <MenuHeader
        restaurantName={restaurantName}
        logo={logo}
        headerBackgroundColor={theme.headerBackgroundColor}
        titleFont={titleFont}
        links={links}
      />

      <NestedCategoryNav
        menu={menu}
        headerBackgroundColor={theme.headerBackgroundColor}
        stripBackgroundColor={theme.categoryStripBackgroundColor}
        accentColor={theme.categoryAccentColor}
        activeParentId={activeParentId}
        activeSubcategoryId={activeSubcategoryId}
        onParentChange={handleParentChange}
        onSubcategoryChange={setActiveSubcategoryId}
      />

      <main className="flex-1 px-4 py-8 sm:px-6">
        {menu.length === 0 || !activeSubcategory ? (
          <div className="py-16 text-center" style={{ color: mainTextColor }}>
            <p className="text-lg font-semibold uppercase tracking-wide" style={{ fontFamily: titleFont }}>
              Menu coming soon!
            </p>
            <p className="mt-2 text-sm opacity-80">This restaurant hasn&apos;t added any dishes yet.</p>
          </div>
        ) : (
          <section className="mx-auto max-w-5xl">
            {activeSubcategory.layout_type === "carousel" ? (
              <DishCarousel
                dishes={activeSubcategory.dishes}
                accentColor={theme.categoryAccentColor}
                mainTextColor={mainTextColor}
                titleFont={titleFont}
                bodyFont={bodyFont}
              />
            ) : (
              <div className="mx-auto max-w-3xl space-y-12">
                {activeSubcategory.dishes.map((dish) => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    titleFont={titleFont}
                    bodyFont={bodyFont}
                    textColor={mainTextColor}
                    accentColor={theme.categoryAccentColor}
                    layout="stacked"
                    imageClassName="w-full"
                  />
                ))}
                {activeSubcategory.dishes.length === 0 && (
                  <p className="text-center text-sm opacity-70" style={{ color: mainTextColor }}>
                    No dishes in this category.
                  </p>
                )}
              </div>
            )}
          </section>
        )}
      </main>

      {(location || hours || contactInfo) && (
        <footer
          className="border-t border-black/5 px-6 py-12"
          style={{ backgroundColor: theme.footerBackgroundColor, color: footerTextColor }}
        >
          <div className="mx-auto max-w-4xl space-y-10 text-center">
            {logo ? (
              <div className="relative mx-auto h-16 w-40">
                <img src={logo} alt={restaurantName} className="mx-auto h-full object-contain" />
              </div>
            ) : (
              <p className="text-2xl font-bold uppercase tracking-[0.25em]" style={{ fontFamily: titleFont }}>
                {restaurantName}
              </p>
            )}

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:text-left">
              {hours && (
                <div>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.2em]" style={{ fontFamily: titleFont }}>
                    Open Hours
                  </h3>
                  <p className="whitespace-pre-line text-sm leading-relaxed">{hours}</p>
                </div>
              )}
              {(location || contactInfo) && (
                <div>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.2em]" style={{ fontFamily: titleFont }}>
                    Location & Contact
                  </h3>
                  <div className="space-y-1 text-sm leading-relaxed">
                    {contactInfo && <p>{contactInfo}</p>}
                    {location && <p>{location}</p>}
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs uppercase tracking-[0.2em] opacity-70">Powered by Menulia.net</p>
          </div>
        </footer>
      )}
    </div>
  );
}
