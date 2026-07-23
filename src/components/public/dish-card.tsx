"use client";

import React, { useState, type ReactElement } from "react";
import { cn, formatPrice } from "@/lib/utils";
import { getAllergenTagMeta, getTagMeta } from "@/lib/dietary-tags";
import type { PublicMenuDisplayOptions } from "@/lib/display-options";
import { resolveLocalizedText, type LocalizedTextValue } from "@/lib/localized-text";
import { normalizeImageUrl } from "@/lib/public-menu-utils";
import {
  hasPriceVariations,
  parsePriceVariationsFromDb,
  shouldDisplayDishPrice,
  type PriceVariation,
} from "@/lib/price-variations";
import type { CategoryLayoutType } from "@/lib/category-layout";
import {
  isStackedCategoryLayout,
  isStackedLeftCategoryLayout,
  isStackedTopCategoryLayout,
} from "@/lib/category-layout";
import {
  isMenuContentLanguage,
  type MenuContentLanguage,
} from "@/lib/menu-content-languages";

export interface PublicMenuDish {
  id: string;
  name: LocalizedTextValue;
  description: LocalizedTextValue;
  price: number;
  price_variations?: PriceVariation[];
  /** If true, do not display price on the public menu */
  hide_price: boolean;
  image: string | null;
  /** Filterable dietary tags — used by public menu filters */
  tags: string[];
  /** Informational allergen indicators — display only */
  allergens: string[];
}

interface DishCardProps {
  dish: PublicMenuDish;
  lang?: string;
  fallbackLang?: string;
  restaurantName: string;
  titleFont: string;
  bodyFont: string;
  titleFontWeight?: number;
  titleFontStyle?: "normal" | "italic";
  bodyFontWeight?: number;
  bodyFontStyle?: "normal" | "italic";
  textColor: string;
  titleColor?: string;
  descriptionColor?: string;
  priceColor?: string;
  display: PublicMenuDisplayOptions;
  layout?: CategoryLayoutType;
  compact?: boolean;
  imageClassName?: string;
  priority?: boolean;
  tagLabelMap?: Record<string, string>;
}

function TagBadge({
  icon,
  label,
  bodyFont,
  bodyFontWeight,
  bodyFontStyle,
  textColor,
  iconOnly = false,
}: {
  icon: string;
  label: string;
  bodyFont: string;
  bodyFontWeight?: number;
  bodyFontStyle?: "normal" | "italic";
  textColor?: string;
  iconOnly?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center ${iconOnly ? "justify-center px-1.5 py-1 text-base" : "gap-1 rounded-full border border-neutral-200/80 bg-transparent px-2.5 py-1 text-xs font-medium text-neutral-900 transition-colors dark:border-white/20 dark:text-white"}`}
      title={iconOnly ? label : undefined}
      aria-label={iconOnly ? label : undefined}
      style={
        iconOnly
          ? undefined
          : {
              fontFamily: bodyFont,
              fontWeight: bodyFontWeight ?? 400,
              fontStyle: bodyFontStyle ?? "normal",
              ...(textColor
                ? {
                    color: textColor,
                    borderColor: `${textColor}40`,
                  }
                : null),
            }
      }
    >
      {icon ? <span>{icon}</span> : null}
      {!iconOnly && label}
    </span>
  );
}

function DishCardInner({
  dish,
  lang = "en",
  fallbackLang = "en",
  restaurantName,
  titleFont,
  bodyFont,
  titleFontWeight,
  titleFontStyle,
  bodyFontWeight,
  bodyFontStyle,
  textColor,
  titleColor,
  descriptionColor,
  priceColor,
  display,
  layout = "carousel",
  compact = false,
  imageClassName = "w-full max-w-xs",
  priority = false,
  tagLabelMap,
}: DishCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!dish?.id) return null;

  const safeDisplay = display ?? {
    showPrices: true,
    showDescriptions: true,
    showImages: true,
    showDietary: true,
  };
  const imageSrc = normalizeImageUrl(dish?.image);
  const showImage = Boolean(safeDisplay.showImages && imageSrc && !imageFailed);

  const resolvedTitle = titleColor ?? textColor;
  const resolvedDescription = descriptionColor ?? textColor;
  const resolvedPrice = priceColor ?? textColor;

  const localizedName =
    resolveLocalizedText(dish?.name, lang, fallbackLang) || "Dish";
  const localizedDescription = resolveLocalizedText(
    dish?.description,
    lang,
    fallbackLang
  );
  const imageAlt = `${localizedName} at ${restaurantName || "restaurant"}`;
  const contentLocale: MenuContentLanguage = isMenuContentLanguage(lang) ? lang : "en";
  const parsedVariations = parsePriceVariationsFromDb(dish?.price_variations);
  const portionOptions = hasPriceVariations(parsedVariations) ? parsedVariations : null;
  const showPrice =
    safeDisplay.showPrices && shouldDisplayDishPrice(dish?.price, portionOptions);

  const isStackedTop = isStackedTopCategoryLayout(layout);
  const isStackedLeft = isStackedLeftCategoryLayout(layout);
  const isStackedLayout = isStackedCategoryLayout(layout);
  const isCarouselPeek = layout === "carousel" && compact;
  const isLeftAligned = isStackedLeft;

  const imageBlock =
    showImage && imageSrc ? (
      <div
        className={cn(
          "relative aspect-square overflow-hidden rounded-xl",
          isStackedLeft ? "h-44 w-44 shrink-0" : imageClassName
        )}
        style={
          isStackedLeft
            ? { width: "176px", height: "176px", flexShrink: 0, borderRadius: "12px" }
            : undefined
        }
      >
        {/* Native img — avoids next/image host/config throws on public menus */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={imageAlt}
          className="absolute inset-0 h-full w-full object-contain"
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onError={() => setImageFailed(true)}
        />
      </div>
    ) : null;

  const titleClampClass = isStackedLayout
    ? "text-base sm:text-lg"
    : cn(
        "line-clamp-2",
        isCarouselPeek ? "text-[11px] leading-snug sm:text-sm" : "text-sm sm:text-base"
      );

  const descriptionClampClass = isStackedLayout
    ? "text-sm leading-relaxed"
    : cn(
        "leading-relaxed",
        isCarouselPeek ? "hidden sm:line-clamp-2 sm:text-xs" : "line-clamp-3 text-xs sm:text-sm"
      );

  const textBlock = (
    <div
      className={cn(
        "flex w-full min-w-0 max-w-none flex-1 flex-col space-y-2",
        isLeftAligned ? "text-left" : "text-center",
        isCarouselPeek && "space-y-1"
      )}
    >
      <h3
        className={cn(
          "w-full max-w-none font-semibold uppercase leading-tight tracking-wide",
          titleClampClass
        )}
        style={{
          color: resolvedTitle,
          fontFamily: titleFont,
          fontWeight: titleFontWeight ?? 400,
          fontStyle: titleFontStyle ?? "normal",
        }}
      >
        {localizedName}
      </h3>
      {safeDisplay.showDescriptions && localizedDescription ? (
        <p
          className={cn("w-full max-w-none", descriptionClampClass)}
          style={{
            color: resolvedDescription,
            fontFamily: bodyFont,
            fontWeight: bodyFontWeight ?? 400,
            fontStyle: bodyFontStyle ?? "normal",
          }}
        >
          {localizedDescription}
        </p>
      ) : null}
      {showPrice && portionOptions ? (
        <div
          className={cn("mt-2 flex flex-col gap-y-1", isStackedTop && "items-center")}
        >
          {(portionOptions ?? []).map((option, optionIndex) => (
            <p
              key={`${option?.label ?? "opt"}-${option?.price ?? optionIndex}`}
              className={cn(
                "font-medium tabular-nums",
                isCarouselPeek ? "text-xs sm:text-sm" : "text-sm sm:text-base"
              )}
              style={{
                color: resolvedPrice,
                fontFamily: bodyFont,
                fontWeight: bodyFontWeight ?? 500,
                fontStyle: bodyFontStyle ?? "normal",
              }}
            >
              {option?.label ?? ""}
              <span className="mx-1.5 opacity-50" aria-hidden>
                ·
              </span>
              {formatPrice(Number(option?.price) || 0)}
            </p>
          ))}
        </div>
      ) : null}
      {safeDisplay.showDietary && (dish?.tags ?? []).length > 0 ? (
        <div
          className={cn(
            "flex flex-wrap gap-2",
            isLeftAligned ? "justify-start" : "justify-center",
            isCarouselPeek && "hidden sm:flex"
          )}
        >
          {(dish?.tags ?? []).filter(Boolean).map((tag, tagIndex) => {
            if (!tag) return null;
            try {
              const meta = getTagMeta(tag, contentLocale, tagLabelMap);
              return (
                <TagBadge
                  key={`${meta?.label ?? tag}-${tagIndex}`}
                  icon={meta?.icon ?? ""}
                  label={meta?.label || String(tag)}
                  bodyFont={bodyFont}
                  bodyFontWeight={bodyFontWeight}
                  bodyFontStyle={bodyFontStyle}
                  textColor={resolvedTitle}
                />
              );
            } catch (tagError) {
              console.error("[DishCard.tag]", tagError);
              return (
                <span key={`tag-fallback-${tagIndex}`} className="text-xs">
                  {String(tag)}
                </span>
              );
            }
          })}
        </div>
      ) : null}
      {safeDisplay.showDietary && (dish?.allergens ?? []).length > 0 ? (
        <div
          className={cn(
            "flex flex-wrap gap-1.5",
            isLeftAligned ? "justify-start" : "justify-center",
            isCarouselPeek && "hidden sm:flex"
          )}
        >
          {(dish?.allergens ?? []).filter(Boolean).map((allergen, allergenIndex) => {
            if (!allergen) return null;
            try {
              const meta = getAllergenTagMeta(allergen, contentLocale);
              return (
                <TagBadge
                  key={`${allergen}-${allergenIndex}`}
                  icon={meta?.icon ?? "⚠️"}
                  label={meta?.label || String(allergen)}
                  bodyFont={bodyFont}
                  bodyFontWeight={bodyFontWeight}
                  bodyFontStyle={bodyFontStyle}
                  iconOnly
                />
              );
            } catch (allergenError) {
              console.error("[DishCard.allergen]", allergenError);
              return null;
            }
          })}
        </div>
      ) : null}
      {showPrice && !portionOptions ? (
        <p
          className={cn("font-bold", isCarouselPeek ? "text-xs sm:text-sm" : "text-base")}
          style={{
            color: resolvedPrice,
            fontFamily: bodyFont,
            fontWeight: bodyFontWeight ?? 400,
            fontStyle: bodyFontStyle ?? "normal",
          }}
        >
          {formatPrice(Number(dish?.price) || 0)}
        </p>
      ) : null}
    </div>
  );

  if (isStackedTop) {
    return (
      <article className="flex w-full flex-col items-center justify-center gap-4">
        {imageBlock ? (
          <div className="mx-auto w-full max-w-[240px] sm:max-w-[260px]">{imageBlock}</div>
        ) : null}
        <div className="flex w-full flex-col items-center text-center">{textBlock}</div>
      </article>
    );
  }

  if (isStackedLeft) {
    return (
      <article className="flex w-full items-center gap-6">
        {safeDisplay.showImages ? (
          imageBlock ? (
            <div
              className="h-44 w-44 shrink-0"
              style={{ width: "176px", height: "176px", flexShrink: 0 }}
            >
              {imageBlock}
            </div>
          ) : (
            <div
              className="w-44 shrink-0 bg-transparent"
              style={{ width: "176px", flexShrink: 0 }}
              aria-hidden
            />
          )
        ) : null}
        <div
          className="w-full min-w-0 max-w-none flex-1 text-left"
          style={{ flex: "1 1 0%", minWidth: "0px", width: "100%" }}
        >
          {textBlock}
        </div>
      </article>
    );
  }

  return (
    <article className={cn("flex w-full flex-col items-center", imageBlock ? "" : "w-full")}>
      {imageBlock}
      <div className={cn(imageBlock ? "mt-3 sm:mt-4" : "w-full", isCarouselPeek && "mt-2 sm:mt-4")}>
        {textBlock}
      </div>
    </article>
  );
}

/** Public dish card — never lets a single dish crash the whole menu tree. */
export function DishCard(props: DishCardProps): ReactElement | null {
  return (
    <DishCardErrorBoundary
      fallbackName={resolveLocalizedText(props?.dish?.name, props?.lang, props?.fallbackLang) || "Dish"}
      textColor={props?.textColor}
    >
      <DishCardInner {...props} />
    </DishCardErrorBoundary>
  );
}

class DishCardErrorBoundary extends React.Component<
  { children: React.ReactNode; fallbackName: string; textColor?: string },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[DishCard] boundary", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <article
          className="w-full py-4 text-center text-sm"
          style={{ color: this.props.textColor }}
        >
          {this.props.fallbackName}
        </article>
      );
    }
    return this.props.children;
  }
}
