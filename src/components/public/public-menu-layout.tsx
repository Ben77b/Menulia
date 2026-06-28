"use client";

import { useEffect, useMemo, useState } from "react";
import { parseContactInfo } from "@/lib/contact-info";
import type { ResolvedMenuTheme, ThemeHotspotId } from "@/lib/advanced-theme";
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
import { PreviewHotspot } from "./preview-hotspot";

export interface PreviewInteractiveConfig {
  enabled: boolean;
  activeHotspot?: ThemeHotspotId | null;
  onHotspotClick?: (id: ThemeHotspotId, anchor: DOMRect) => void;
}

interface PublicMenuLayoutProps {
  restaurantName: string;
  logo: string | null;
  location: string;
  hours: string;
  contactInfo: string;
  footerSlogan?: string;
  theme: ResolvedMenuTheme;
  titleFont: string;
  bodyFont: string;
  titleFontWeight?: number;
  titleFontStyle?: "normal" | "italic";
  categoryFont: string;
  categoryFontWeight?: number;
  categoryFontStyle?: "normal" | "italic";
  bodyFontWeight?: number;
  bodyFontStyle?: "normal" | "italic";
  menu: PublicMenuParentCategory[];
  flatCategories: PublicMenuSubcategory[];
  hasNestedStructure: boolean;
  links: RestaurantLink[];
  display: PublicMenuDisplayOptions;
  previewInteractive?: PreviewInteractiveConfig;
}

function DishSection({
  subcategory,
  theme,
  titleFont,
  bodyFont,
  titleFontWeight,
  titleFontStyle,
  bodyFontWeight,
  bodyFontStyle,
  locale,
  activeFilters,
  display,
  previewInteractive,
}: {
  subcategory: PublicMenuSubcategory;
  theme: ResolvedMenuTheme;
  titleFont: string;
  bodyFont: string;
  titleFontWeight?: number;
  titleFontStyle?: "normal" | "italic";
  bodyFontWeight?: number;
  bodyFontStyle?: "normal" | "italic";
  locale: PublicMenuLocale;
  activeFilters: Set<string>;
  display: PublicMenuDisplayOptions;
  previewInteractive?: PreviewInteractiveConfig;
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

  const hotspotEnabled = previewInteractive?.enabled ?? false;

  if (subcategory.layout_type === "carousel") {
    return (
      <PreviewHotspot
        id="carousel"
        enabled={hotspotEnabled}
        active={previewInteractive?.activeHotspot === "carousel"}
        onSelect={previewInteractive?.onHotspotClick}
        indicatorPosition="center-right"
      >
        <DishCarousel
          dishes={filteredDishes}
          accentColor={theme.carouselArrowBg}
          arrowIconColor={theme.carouselArrowIcon}
          mainTextColor={theme.itemTitleText}
          titleFont={titleFont}
          bodyFont={bodyFont}
          titleFontWeight={titleFontWeight}
          titleFontStyle={titleFontStyle}
          bodyFontWeight={bodyFontWeight}
          bodyFontStyle={bodyFontStyle}
          display={display}
          titleColor={theme.itemTitleText}
          descriptionColor={theme.itemDescriptionText}
          priceColor={theme.priceTextColor}
          emptyMessage={emptyMessage}
        />
      </PreviewHotspot>
    );
  }

  return (
    <PreviewHotspot
      id="menuItem"
      enabled={hotspotEnabled}
      active={previewInteractive?.activeHotspot === "menuItem"}
      onSelect={previewInteractive?.onHotspotClick}
      indicatorPosition="center-left"
    >
      <div className="mx-auto max-w-3xl space-y-12">
        {filteredDishes.map((dish) => (
          <DishCard
            key={dish.id}
            dish={dish}
            titleFont={titleFont}
            bodyFont={bodyFont}
            titleFontWeight={titleFontWeight}
            titleFontStyle={titleFontStyle}
            bodyFontWeight={bodyFontWeight}
            bodyFontStyle={bodyFontStyle}
            textColor={theme.itemTitleText}
            titleColor={theme.itemTitleText}
            descriptionColor={theme.itemDescriptionText}
            priceColor={theme.priceTextColor}
            display={display}
            layout="stacked"
            imageClassName="w-full"
          />
        ))}
        {filteredDishes.length === 0 && (
          <p className="text-center text-sm" style={{ color: theme.itemTitleText }}>
            {emptyMessage}
          </p>
        )}
      </div>
    </PreviewHotspot>
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
  titleFontWeight,
  titleFontStyle,
  categoryFont,
  categoryFontWeight,
  categoryFontStyle,
  bodyFontWeight,
  bodyFontStyle,
  menu,
  flatCategories,
  hasNestedStructure,
  links,
  display,
  previewInteractive,
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

  const { phone: contactPhone, email: contactEmail } = parseContactInfo(contactInfo);
  const hasMenu = hasNestedStructure ? menu.length > 0 : flatCategories.length > 0;
  const hotspotEnabled = previewInteractive?.enabled ?? false;

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
      style={{
        backgroundColor: theme.menuBackground,
        color: theme.itemTitleText,
        fontFamily: bodyFont,
        fontWeight: bodyFontWeight ?? 400,
        fontStyle: bodyFontStyle ?? "normal",
      }}
    >
      <PreviewHotspot
        id="header"
        enabled={hotspotEnabled}
        active={previewInteractive?.activeHotspot === "header"}
        onSelect={previewInteractive?.onHotspotClick}
        indicatorPosition="top-right"
      >
        <MenuHeader
          restaurantName={restaurantName}
          logo={logo}
          headerBackgroundColor={theme.logoAreaBg}
          headerTextColor={theme.logoAreaText}
          titleFont={titleFont}
          titleFontWeight={titleFontWeight}
          titleFontStyle={titleFontStyle}
          links={links}
          locale={locale}
          onLocaleChange={setLocale}
        />
      </PreviewHotspot>

      <PreviewHotspot
        id="categoryBar"
        enabled={hotspotEnabled}
        active={previewInteractive?.activeHotspot === "categoryBar"}
        onSelect={previewInteractive?.onHotspotClick}
        indicatorPosition="center-right"
      >
        {hasNestedStructure ? (
          <NestedCategoryNav
            menu={menu}
            headerBackgroundColor={theme.logoAreaBg}
            stripBackgroundColor={theme.categoryBarBg}
            tier1ActiveBg={theme.tier1ActiveBg}
            tier1ActiveText={theme.tier1ActiveText}
            tier1ActiveBorder={theme.tier1ActiveBorder}
            tier1InactiveBg={theme.tier1InactiveBg}
            tier1InactiveText={theme.tier1InactiveText}
            tier1InactiveBorder={theme.tier1InactiveBorder}
            tier2ActiveBg={theme.tier2ActiveBg}
            tier2ActiveText={theme.tier2ActiveText}
            tier2ActiveBorder={theme.tier2ActiveBorder}
            tier2InactiveBg={theme.tier2InactiveBg}
            tier2InactiveText={theme.tier2InactiveText}
            tier2InactiveBorder={theme.tier2InactiveBorder}
            categoryFont={categoryFont}
            categoryFontWeight={categoryFontWeight}
            categoryFontStyle={categoryFontStyle}
            activeParentId={activeParentId}
            activeSubcategoryId={activeSubcategoryId}
            showTier1
            onParentChange={handleParentChange}
            onSubcategoryChange={setActiveSubcategoryId}
          />
        ) : (
          <FlatCategoryNav
            categories={flatCategories}
            stripBackgroundColor={theme.categoryBarBg}
            tier2ActiveBg={theme.tier2ActiveBg}
            tier2ActiveText={theme.tier2ActiveText}
            tier2ActiveBorder={theme.tier2ActiveBorder}
            tier2InactiveBg={theme.tier2InactiveBg}
            tier2InactiveText={theme.tier2InactiveText}
            tier2InactiveBorder={theme.tier2InactiveBorder}
            categoryFont={categoryFont}
            categoryFontWeight={categoryFontWeight}
            categoryFontStyle={categoryFontStyle}
            activeCategoryId={activeSubcategoryId}
            onCategoryChange={setActiveSubcategoryId}
          />
        )}
      </PreviewHotspot>

      <main
        className="flex-1 px-4 py-8 sm:px-6"
        style={{ borderTop: `1px solid ${theme.dividerLineColor}` }}
      >
        {!hasMenu || !activeSubcategory ? (
          <div className="py-16 text-center" style={{ color: theme.itemTitleText }}>
            <p
              className="text-lg font-semibold uppercase tracking-wide"
              style={{
                fontFamily: titleFont,
                fontWeight: titleFontWeight ?? 400,
                fontStyle: titleFontStyle ?? "normal",
                color: theme.itemTitleText,
              }}
            >
              Menu coming soon!
            </p>
            <p className="mt-2 text-sm" style={{ color: theme.itemDescriptionText }}>
              This restaurant hasn&apos;t added any dishes yet.
            </p>
          </div>
        ) : (
          <section className="mx-auto max-w-5xl">
            <DishSection
              subcategory={activeSubcategory}
              theme={theme}
              titleFont={titleFont}
              bodyFont={bodyFont}
              titleFontWeight={titleFontWeight}
              titleFontStyle={titleFontStyle}
              bodyFontWeight={bodyFontWeight}
              bodyFontStyle={bodyFontStyle}
              locale={locale}
              activeFilters={activeFilters}
              display={display}
              previewInteractive={previewInteractive}
            />
          </section>
        )}
      </main>

      {display.showDietary && (
        <PreviewHotspot
          id="filters"
          enabled={hotspotEnabled}
          active={previewInteractive?.activeHotspot === "filters"}
          onSelect={previewInteractive?.onHotspotClick}
          indicatorPosition="top-left"
        >
          <PublicMenuFilterBar
            backgroundColor={theme.filterAreaBg}
            textColor={theme.filterText}
            borderColor={theme.filterBorder}
            titleFont={titleFont}
            bodyFont={bodyFont}
            titleFontWeight={titleFontWeight}
            titleFontStyle={titleFontStyle}
            bodyFontWeight={bodyFontWeight}
            bodyFontStyle={bodyFontStyle}
            locale={locale}
            activeFilters={activeFilters}
            onToggleFilter={toggleFilter}
            menuTags={menuTags}
          />
        </PreviewHotspot>
      )}

      <PreviewHotspot
        id="footer"
        enabled={hotspotEnabled}
        active={previewInteractive?.activeHotspot === "footer"}
        onSelect={previewInteractive?.onHotspotClick}
        indicatorPosition="bottom-right"
      >
        <PublicMenuFooter
          restaurantName={restaurantName}
          logo={logo}
          location={location}
          hours={hours}
          contactPhone={contactPhone}
          contactEmail={contactEmail}
          footerSlogan={footerSlogan}
          footerBackgroundColor={theme.footerBackgroundColor}
          footerTextColor={theme.footerTextIcon}
          titleFont={titleFont}
          bodyFont={bodyFont}
          titleFontWeight={titleFontWeight}
          titleFontStyle={titleFontStyle}
          bodyFontWeight={bodyFontWeight}
          bodyFontStyle={bodyFontStyle}
          locale={locale}
        />
      </PreviewHotspot>
    </div>
  );
}
