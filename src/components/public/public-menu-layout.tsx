"use client";

import { useEffect, useMemo, useState } from "react";
import { contrastingTextColor } from "@/lib/contrast";
import { parseContactInfo } from "@/lib/contact-info";
import type { MenuThemeColors } from "@/lib/theme-colors";
import type { PublicMenuParentCategory, PublicMenuSubcategory } from "@/lib/menu-hierarchy";
import type { RestaurantLink } from "@/lib/restaurant-links";
import { RestaurantLogo } from "@/components/restaurant-logo";
import { MenuHeader } from "./menu-header";
import { NestedCategoryNav } from "./nested-category-nav";
import { FlatCategoryNav } from "./flat-category-nav";
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
  flatCategories: PublicMenuSubcategory[];
  hasNestedStructure: boolean;
  links: RestaurantLink[];
}

function DishSection({
  subcategory,
  mainTextColor,
  theme,
  titleFont,
  bodyFont,
}: {
  subcategory: PublicMenuSubcategory;
  mainTextColor: string;
  theme: MenuThemeColors;
  titleFont: string;
  bodyFont: string;
}) {
  if (subcategory.layout_type === "carousel") {
    return (
      <DishCarousel
        dishes={subcategory.dishes}
        accentColor={theme.categoryAccentColor}
        mainTextColor={mainTextColor}
        titleFont={titleFont}
        bodyFont={bodyFont}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      {subcategory.dishes.map((dish) => (
        <DishCard
          key={dish.id}
          dish={dish}
          titleFont={titleFont}
          bodyFont={bodyFont}
          textColor={mainTextColor}
          layout="stacked"
          imageClassName="w-full"
        />
      ))}
      {subcategory.dishes.length === 0 && (
        <p className="text-center text-sm" style={{ color: mainTextColor }}>
          No dishes in this category.
        </p>
      )}
    </div>
  );
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
  flatCategories,
  hasNestedStructure,
  links,
}: PublicMenuLayoutProps) {
  const [activeParentId, setActiveParentId] = useState(menu[0]?.id ?? "");
  const [activeSubcategoryId, setActiveSubcategoryId] = useState(
    menu[0]?.subcategories[0]?.id ?? flatCategories[0]?.id ?? ""
  );

  useEffect(() => {
    if (hasNestedStructure) {
      if (menu.length === 0) return;
      if (!menu.some((parent) => parent.id === activeParentId)) {
        setActiveParentId(menu[0].id);
        setActiveSubcategoryId(menu[0].subcategories[0]?.id ?? "");
      }
      return;
    }

    if (flatCategories.length === 0) return;
    if (!flatCategories.some((category) => category.id === activeSubcategoryId)) {
      setActiveSubcategoryId(flatCategories[0].id);
    }
  }, [menu, flatCategories, hasNestedStructure, activeParentId, activeSubcategoryId]);

  const activeSubcategory = useMemo(() => {
    if (!hasNestedStructure) {
      return flatCategories.find((category) => category.id === activeSubcategoryId) ?? flatCategories[0];
    }

    const parent = menu.find((item) => item.id === activeParentId) ?? menu[0];
    return (
      parent?.subcategories.find((sub) => sub.id === activeSubcategoryId) ??
      parent?.subcategories[0]
    );
  }, [menu, flatCategories, hasNestedStructure, activeParentId, activeSubcategoryId]);

  const mainTextColor = contrastingTextColor(theme.mainContentBackgroundColor);
  const footerTextColor = contrastingTextColor(theme.footerBackgroundColor);
  const { phone: contactPhone, email: contactEmail } = parseContactInfo(contactInfo);
  const hasMenu = hasNestedStructure ? menu.length > 0 : flatCategories.length > 0;

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
      style={{ backgroundColor: theme.mainContentBackgroundColor, color: mainTextColor, fontFamily: bodyFont }}
    >
      <MenuHeader
        restaurantName={restaurantName}
        logo={logo}
        headerBackgroundColor={theme.headerBackgroundColor}
        titleFont={titleFont}
        links={links}
      />

      {hasNestedStructure ? (
        <NestedCategoryNav
          menu={menu}
          headerBackgroundColor={theme.headerBackgroundColor}
          stripBackgroundColor={theme.categoryStripBackgroundColor}
          accentColor={theme.categoryAccentColor}
          activeParentId={activeParentId}
          activeSubcategoryId={activeSubcategoryId}
          showTier1
          onParentChange={handleParentChange}
          onSubcategoryChange={setActiveSubcategoryId}
        />
      ) : (
        <FlatCategoryNav
          categories={flatCategories}
          stripBackgroundColor={theme.categoryStripBackgroundColor}
          accentColor={theme.categoryAccentColor}
          activeCategoryId={activeSubcategoryId}
          onCategoryChange={setActiveSubcategoryId}
        />
      )}

      <main className="flex-1 px-4 py-8 sm:px-6">
        {!hasMenu || !activeSubcategory ? (
          <div className="py-16 text-center" style={{ color: mainTextColor }}>
            <p className="text-lg font-semibold uppercase tracking-wide" style={{ fontFamily: titleFont, color: mainTextColor }}>
              Menu coming soon!
            </p>
            <p className="mt-2 text-sm" style={{ color: mainTextColor }}>
              This restaurant hasn&apos;t added any dishes yet.
            </p>
          </div>
        ) : (
          <section className="mx-auto max-w-5xl">
            <DishSection
              subcategory={activeSubcategory}
              mainTextColor={mainTextColor}
              theme={theme}
              titleFont={titleFont}
              bodyFont={bodyFont}
            />
          </section>
        )}
      </main>

      {(location || hours || contactPhone || contactEmail) && (
        <footer
          className="border-t border-black/5 px-6 py-12"
          style={{ backgroundColor: theme.footerBackgroundColor, color: footerTextColor }}
        >
          <div className="mx-auto max-w-4xl space-y-10 text-center">
            {logo ? (
              <RestaurantLogo
                src={logo}
                alt={restaurantName}
                wrapperClassName="mx-auto h-16 w-40"
                className="h-16 w-full"
              />
            ) : (
              <p
                className="text-2xl font-bold uppercase tracking-[0.25em]"
                style={{ fontFamily: titleFont, color: footerTextColor }}
              >
                {restaurantName}
              </p>
            )}

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:text-left">
              {hours && (
                <div style={{ color: footerTextColor }}>
                  <h3
                    className="mb-3 text-sm font-bold uppercase tracking-[0.2em]"
                    style={{ fontFamily: titleFont, color: footerTextColor }}
                  >
                    Open Hours
                  </h3>
                  <p className="whitespace-pre-line text-sm leading-relaxed" style={{ color: footerTextColor }}>
                    {hours}
                  </p>
                </div>
              )}
              {(location || contactPhone || contactEmail) && (
                <div style={{ color: footerTextColor }}>
                  <h3
                    className="mb-3 text-sm font-bold uppercase tracking-[0.2em]"
                    style={{ fontFamily: titleFont, color: footerTextColor }}
                  >
                    Location & Contact
                  </h3>
                  <div className="space-y-1 text-sm leading-relaxed" style={{ color: footerTextColor }}>
                    {contactPhone && <p>{contactPhone}</p>}
                    {contactEmail && <p>{contactEmail}</p>}
                    {location && <p>{location}</p>}
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: footerTextColor }}>
              Powered by Menulia.net
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
