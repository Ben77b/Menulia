"use client";

import { useEffect, useMemo, useState } from "react";
import { contrastingTextColor } from "@/lib/contrast";
import { parseContactInfo } from "@/lib/contact-info";
import type { MenuThemeColors } from "@/lib/theme-colors";
import type { PublicMenuParentCategory, PublicMenuSubcategory } from "@/lib/menu-hierarchy";
import type { RestaurantLink } from "@/lib/restaurant-links";
import type { PublicMenuDisplayOptions } from "@/lib/display-options";
import { menuUiString, type PublicMenuLocale } from "@/lib/public-menu-i18n";
import {
  collectAllDishes,
  collectMenuTags,
  filterDishesByTags,
} from "@/lib/public-menu-utils";
import { MenuHeader } from "./menu-header";
import { NestedCategoryNav } from "./nested-category-nav";
import { FlatCategoryNav } from "./flat-category-nav";
import { DishCarousel } from "./dish-carousel";
import { DishCard } from "./dish-card";
import { PublicMenuFooter } from "./public-menu-footer";
import { PublicMenuFilterBar } from "./public-menu-filter-bar";

interface PublicMenuLayoutProps {
  restaurantName: string;
  logo: string | null;
  location: string;
  hours: string;
  contactInfo: string;
  footerSlogan?: string;
  theme: MenuThemeColors;
  titleFont: string;
  bodyFont: string;
  menu: PublicMenuParentCategory[];
  flatCategories: PublicMenuSubcategory[];
  hasNestedStructure: boolean;
  links: RestaurantLink[];
  display: PublicMenuDisplayOptions;
}

function DishSection({
  subcategory,
  mainTextColor,
  theme,
  titleFont,
  bodyFont,
  locale,
  activeFilters,
  display,
}: {
  subcategory: PublicMenuSubcategory;
  mainTextColor: string;
  theme: MenuThemeColors;
  titleFont: string;
  bodyFont: string;
  locale: PublicMenuLocale;
  activeFilters: Set<string>;
  display: PublicMenuDisplayOptions;
}) {
  const filteredDishes = useMemo(() => {
    if (!display.showDietary || activeFilters.size === 0) {
      return subcategory.dishes;
    }
    return filterDishesByTags(subcategory.dishes, activeFilters);
  }, [subcategory.dishes, activeFilters, display.showDietary]);

  const emptyMessage =
    subcategory.dishes.length === 0
      ? menuUiString(locale, "noDishes")
      : menuUiString(locale, "noFilterMatch");

  if (subcategory.layout_type === "carousel") {
    return (
      <DishCarousel
        dishes={filteredDishes}
        accentColor={theme.categoryAccentColor}
        mainTextColor={mainTextColor}
        titleFont={titleFont}
        bodyFont={bodyFont}
        display={display}
        emptyMessage={emptyMessage}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      {filteredDishes.map((dish) => (
        <DishCard
          key={dish.id}
          dish={dish}
          titleFont={titleFont}
          bodyFont={bodyFont}
          textColor={mainTextColor}
          display={display}
          layout="stacked"
          imageClassName="w-full"
        />
      ))}
      {filteredDishes.length === 0 && (
        <p className="text-center text-sm" style={{ color: mainTextColor }}>
          {emptyMessage}
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
  footerSlogan = "",
  theme,
  titleFont,
  bodyFont,
  menu,
  flatCategories,
  hasNestedStructure,
  links,
  display,
}: PublicMenuLayoutProps) {
  const [locale, setLocale] = useState<PublicMenuLocale>("en");
  const [activeParentId, setActiveParentId] = useState(menu[0]?.id ?? "");
  const [activeSubcategoryId, setActiveSubcategoryId] = useState(
    menu[0]?.subcategories[0]?.id ?? flatCategories[0]?.id ?? ""
  );
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

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

  const allDishes = useMemo(
    () => collectAllDishes(menu, flatCategories, hasNestedStructure),
    [menu, flatCategories, hasNestedStructure]
  );

  const menuTags = useMemo(() => collectMenuTags(allDishes), [allDishes]);

  const mainTextColor = contrastingTextColor(theme.mainContentBackgroundColor);
  const { phone: contactPhone, email: contactEmail } = parseContactInfo(contactInfo);
  const hasMenu = hasNestedStructure ? menu.length > 0 : flatCategories.length > 0;

  function handleParentChange(parentId: string) {
    setActiveParentId(parentId);
    const parent = menu.find((item) => item.id === parentId);
    if (parent?.subcategories[0]) {
      setActiveSubcategoryId(parent.subcategories[0].id);
    }
  }

  function toggleFilter(tag: string) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
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
        locale={locale}
        onLocaleChange={setLocale}
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
              locale={locale}
              activeFilters={activeFilters}
              display={display}
            />
          </section>
        )}
      </main>

      {display.showDietary && (
        <PublicMenuFilterBar
          backgroundColor={theme.footerBackgroundColor}
          titleFont={titleFont}
          bodyFont={bodyFont}
          locale={locale}
          activeFilters={activeFilters}
          onToggleFilter={toggleFilter}
          menuTags={menuTags}
        />
      )}

      <PublicMenuFooter
        restaurantName={restaurantName}
        logo={logo}
        location={location}
        hours={hours}
        contactPhone={contactPhone}
        contactEmail={contactEmail}
        footerSlogan={footerSlogan}
        footerBackgroundColor={theme.footerBackgroundColor}
        titleFont={titleFont}
        bodyFont={bodyFont}
        locale={locale}
      />
    </div>
  );
}
