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
  filterDishesByTags,
  sanitizePublicMenuTree,
} from "@/lib/public-menu-utils";
import { MenuHeader } from "./menu-header";
import { NestedCategoryNav } from "./nested-category-nav";
import { FlatCategoryNav } from "./flat-category-nav";
import { DishCarousel } from "./dish-carousel";
import { DishCard } from "./dish-card";
import { PublicMenuFooter } from "./public-menu-footer";
import { PublicMenuFilterBar } from "./public-menu-filter-bar";
import { PreviewHotspot } from "./preview-hotspot";
import { themedColor } from "@/lib/preview-theme-vars";
import { usePreviewCanvas } from "@/contexts/preview-canvas-context";

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
  isPreview,
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
  isPreview: boolean;
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
        id="menuItem"
        enabled={hotspotEnabled}
        active={previewInteractive?.activeHotspot === "menuItem"}
        onSelect={previewInteractive?.onHotspotClick}
        indicatorPosition="center-right"
      >
        <DishCarousel
          dishes={filteredDishes}
          accentColor={themedColor(isPreview, "carouselArrowBg", theme.carouselArrowBg)}
          arrowIconColor={themedColor(isPreview, "carouselArrowIcon", theme.carouselArrowIcon)}
          mainTextColor={themedColor(isPreview, "itemTitle", theme.itemTitleText)}
          titleFont={titleFont}
          bodyFont={bodyFont}
          titleFontWeight={titleFontWeight}
          titleFontStyle={titleFontStyle}
          bodyFontWeight={bodyFontWeight}
          bodyFontStyle={bodyFontStyle}
          display={display}
          titleColor={themedColor(isPreview, "itemTitle", theme.itemTitleText)}
          descriptionColor={themedColor(isPreview, "itemDescription", theme.itemDescriptionText)}
          priceColor={themedColor(isPreview, "itemPrice", theme.priceTextColor)}
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
            textColor={themedColor(isPreview, "itemTitle", theme.itemTitleText)}
            titleColor={themedColor(isPreview, "itemTitle", theme.itemTitleText)}
            descriptionColor={themedColor(isPreview, "itemDescription", theme.itemDescriptionText)}
            priceColor={themedColor(isPreview, "itemPrice", theme.priceTextColor)}
            display={display}
            layout="stacked"
            imageClassName="w-full"
          />
        ))}
        {filteredDishes.length === 0 && (
          <p className="text-center text-sm" style={{ color: themedColor(isPreview, "itemTitle", theme.itemTitleText) }}>
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
  const { menu: safeMenu, flatCategories: safeFlatCategories } = useMemo(
    () => sanitizePublicMenuTree(menu ?? [], flatCategories ?? []),
    [menu, flatCategories]
  );

  const [locale, setLocale] = useState<PublicMenuLocale>("en");
  const [activeParentId, setActiveParentId] = useState(safeMenu[0]?.id ?? "");
  const [activeSubcategoryId, setActiveSubcategoryId] = useState(
    safeMenu[0]?.subcategories[0]?.id ?? safeFlatCategories[0]?.id ?? ""
  );
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (hasNestedStructure) {
      if (safeMenu.length === 0) return;
      if (!safeMenu.some((parent) => parent.id === activeParentId)) {
        setActiveParentId(safeMenu[0].id);
        setActiveSubcategoryId(safeMenu[0].subcategories[0]?.id ?? "");
      }
      return;
    }

    if (safeFlatCategories.length === 0) return;
    if (!safeFlatCategories.some((category) => category.id === activeSubcategoryId)) {
      setActiveSubcategoryId(safeFlatCategories[0].id);
    }
  }, [safeMenu, safeFlatCategories, hasNestedStructure, activeParentId, activeSubcategoryId]);

  const activeSubcategory = useMemo(() => {
    if (!hasNestedStructure) {
      return (
        safeFlatCategories.find((category) => category.id === activeSubcategoryId) ??
        safeFlatCategories[0]
      );
    }

    const parent = safeMenu.find((item) => item.id === activeParentId) ?? safeMenu[0];
    return (
      parent?.subcategories.find((sub) => sub.id === activeSubcategoryId) ??
      parent?.subcategories[0]
    );
  }, [safeMenu, safeFlatCategories, hasNestedStructure, activeParentId, activeSubcategoryId]);

  const allDishes = useMemo(
    () => collectAllDishes(safeMenu, safeFlatCategories, hasNestedStructure),
    [safeMenu, safeFlatCategories, hasNestedStructure]
  );

  const { phone: contactPhone, email: contactEmail } = parseContactInfo(contactInfo);
  const hasMenu = hasNestedStructure ? safeMenu.length > 0 : safeFlatCategories.length > 0;
  const hotspotEnabled = previewInteractive?.enabled ?? false;
  const isPreview = usePreviewCanvas();

  function handleParentChange(parentId: string) {
    setActiveParentId(parentId);
    const parent = safeMenu.find((item) => item.id === parentId);
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
        backgroundColor: themedColor(isPreview, "menuBackground", theme.menuBackground),
        color: themedColor(isPreview, "itemTitle", theme.itemTitleText),
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
          headerBackgroundColor={themedColor(isPreview, "headerBg", theme.logoAreaBg)}
          headerTextColor={themedColor(isPreview, "headerText", theme.logoAreaText)}
          titleFont={titleFont}
          titleFontWeight={titleFontWeight}
          titleFontStyle={titleFontStyle}
          links={links ?? []}
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
            menu={safeMenu}
            stripBackgroundColor={themedColor(isPreview, "navBg", theme.categoryBarBg)}
            tier1ActiveBg={themedColor(isPreview, "tier1ActiveBg", theme.tier1ActiveBg)}
            tier1ActiveText={themedColor(isPreview, "tier1ActiveText", theme.tier1ActiveText)}
            tier1ActiveBorder={themedColor(isPreview, "tier1ActiveBorder", theme.tier1ActiveBorder)}
            tier1InactiveBg={themedColor(isPreview, "tier1InactiveBg", theme.tier1InactiveBg)}
            tier1InactiveText={themedColor(isPreview, "tier1InactiveText", theme.tier1InactiveText)}
            tier1InactiveBorder={themedColor(isPreview, "tier1InactiveBorder", theme.tier1InactiveBorder)}
            tier2ActiveBg={themedColor(isPreview, "activeTabBg", theme.tier2ActiveBg)}
            tier2ActiveText={themedColor(isPreview, "activeTabText", theme.tier2ActiveText)}
            tier2ActiveBorder={themedColor(isPreview, "activeTabBorder", theme.tier2ActiveBorder)}
            tier2InactiveBg={themedColor(isPreview, "inactiveTabBg", theme.tier2InactiveBg)}
            tier2InactiveText={themedColor(isPreview, "inactiveTabText", theme.tier2InactiveText)}
            tier2InactiveBorder={themedColor(isPreview, "inactiveTabBorder", theme.tier2InactiveBorder)}
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
            categories={safeFlatCategories}
            stripBackgroundColor={themedColor(isPreview, "navBg", theme.categoryBarBg)}
            tier2ActiveBg={themedColor(isPreview, "activeTabBg", theme.tier2ActiveBg)}
            tier2ActiveText={themedColor(isPreview, "activeTabText", theme.tier2ActiveText)}
            tier2ActiveBorder={themedColor(isPreview, "activeTabBorder", theme.tier2ActiveBorder)}
            tier2InactiveBg={themedColor(isPreview, "inactiveTabBg", theme.tier2InactiveBg)}
            tier2InactiveText={themedColor(isPreview, "inactiveTabText", theme.tier2InactiveText)}
            tier2InactiveBorder={themedColor(isPreview, "inactiveTabBorder", theme.tier2InactiveBorder)}
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
        style={{ borderTop: `1px solid ${themedColor(isPreview, "dividerLine", theme.dividerLineColor)}` }}
      >
        {!hasMenu || !activeSubcategory ? (
          <div className="py-16 text-center" style={{ color: themedColor(isPreview, "itemTitle", theme.itemTitleText) }}>
            <p
              className="text-lg font-semibold uppercase tracking-wide"
              style={{
                fontFamily: titleFont,
                fontWeight: titleFontWeight ?? 400,
                fontStyle: titleFontStyle ?? "normal",
                color: themedColor(isPreview, "itemTitle", theme.itemTitleText),
              }}
            >
              Menu coming soon!
            </p>
            <p className="mt-2 text-sm" style={{ color: themedColor(isPreview, "itemDescription", theme.itemDescriptionText) }}>
              This restaurant hasn&apos;t added any dishes yet.
            </p>
          </div>
        ) : (
          <section className="mx-auto max-w-5xl">
            <DishSection
              subcategory={activeSubcategory}
              theme={theme}
              isPreview={isPreview}
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
            backgroundColor={themedColor(isPreview, "filterBg", theme.filterAreaBg)}
            textColor={themedColor(isPreview, "filterText", theme.filterText)}
            borderColor={themedColor(isPreview, "filterBorder", theme.filterBorder)}
            titleFont={titleFont}
            bodyFont={bodyFont}
            titleFontWeight={titleFontWeight}
            titleFontStyle={titleFontStyle}
            bodyFontWeight={bodyFontWeight}
            bodyFontStyle={bodyFontStyle}
            locale={locale}
            activeFilters={activeFilters}
            onToggleFilter={toggleFilter}
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
          footerBackgroundColor={themedColor(isPreview, "footerBg", theme.footerBackgroundColor)}
          footerTextColor={themedColor(isPreview, "footerText", theme.footerTextIcon)}
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
