"use client";

import { useState } from "react";
import { cn, formatPrice } from "@/lib/utils";
import { getAllergenTagMeta, getFilterableTagMeta } from "@/lib/dietary-tags";
import type { PublicMenuDisplayOptions } from "@/lib/display-options";
import { resolveLocalizedText, type LocalizedTextValue } from "@/lib/localized-text";
import { normalizeImageUrl } from "@/lib/public-menu-utils";
import { hasPriceVariations, parsePriceVariationsFromDb, type PriceVariation } from "@/lib/price-variations";
import type { CategoryLayoutType } from "@/lib/category-layout";
import {
  isStackedCategoryLayout,
} from "@/lib/category-layout";

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
}

function TagBadge({
  icon,
  label,
  textColor,
  bodyFont,
  bodyFontWeight,
  bodyFontStyle,
  iconOnly = false,
}: {
  icon: string;
  label: string;
  textColor: string;
  bodyFont: string;
  bodyFontWeight?: number;
  bodyFontStyle?: "normal" | "italic";
  iconOnly?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center ${iconOnly ? "justify-center px-1.5 py-1 text-base" : "gap-1 rounded-full px-2.5 py-1 text-xs font-medium"}`}
      title={iconOnly ? label : undefined}
      aria-label={iconOnly ? label : undefined}
      style={
        iconOnly
          ? undefined
          : {
              color: textColor,
              border: `1px solid ${textColor}`,
              fontFamily: bodyFont,
              fontWeight: bodyFontWeight ?? 400,
              fontStyle: bodyFontStyle ?? "normal",
            }
      }
    >
      {icon && <span>{icon}</span>}
      {!iconOnly && label}
    </span>
  );
}

export function DishCard({
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
}: DishCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = normalizeImageUrl(dish?.image);
  const showImage = Boolean(display?.showImages && imageSrc && !imageFailed);

  const resolvedTitle = titleColor ?? textColor;
  const resolvedDescription = descriptionColor ?? textColor;
  const resolvedPrice = priceColor ?? textColor;

  const localizedName = resolveLocalizedText(dish.name, lang, fallbackLang);
  const localizedDescription = resolveLocalizedText(dish.description, lang, fallbackLang);
  const imageAlt = `${localizedName} at ${restaurantName}`;
  const allergenLocale = lang === "es" ? "es" : "en";
  const parsedVariations = parsePriceVariationsFromDb(dish.price_variations);
  const portionOptions = hasPriceVariations(parsedVariations) ? parsedVariations : null;

  const isStackedLayout = isStackedCategoryLayout(layout);
  const isCarouselPeek = layout === "carousel" && compact;
  // Public list layouts (stacked + stacked_left) share the side-image row
  const useSideImageRow = isStackedLayout;
  const isLeftAligned = useSideImageRow;

  // Hard inline styles — bypass Tailwind purge/cache for public stacked-left cards
  const STACKED_LEFT_FRAME = {
    width: "112px",
    height: "112px",
    borderRadius: "16px",
    overflow: "hidden",
    flexShrink: 0,
    position: "relative",
    backgroundColor: "transparent",
  } as const;

  const STACKED_LEFT_IMG = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center",
    display: "block",
    backgroundColor: "transparent",
  } as const;

  const imageBlock =
    showImage && imageSrc ? (
      useSideImageRow ? (
        <div style={STACKED_LEFT_FRAME} data-menulia-dish-image="stacked-left-v3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={imageAlt}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            onError={() => setImageFailed(true)}
            style={STACKED_LEFT_IMG}
          />
        </div>
      ) : (
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "1 / 1",
            borderRadius: "16px",
            overflow: "hidden",
            backgroundColor: "transparent",
            flexShrink: 0,
          }}
          className={imageClassName}
          data-menulia-dish-image="square-v3"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={imageAlt}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            onError={() => setImageFailed(true)}
            style={STACKED_LEFT_IMG}
          />
        </div>
      )
    ) : null;

  const titleClampClass = isStackedLayout
    ? "whitespace-pre-wrap text-base sm:text-lg"
    : cn(
        "line-clamp-2",
        isCarouselPeek ? "text-[11px] leading-snug sm:text-sm" : "text-sm sm:text-base"
      );

  const descriptionClampClass = isStackedLayout
    ? "text-sm whitespace-pre-wrap leading-relaxed"
    : cn(
        "leading-relaxed",
        isCarouselPeek ? "hidden sm:line-clamp-2 sm:text-xs" : "line-clamp-3 text-xs sm:text-sm"
      );

  const textBlock = (
    <div
      className={cn(
        "flex w-full flex-col space-y-2",
        isLeftAligned ? "text-left" : "text-center",
        isCarouselPeek && "space-y-1"
      )}
    >
      <h3
        className={cn("font-semibold uppercase leading-tight tracking-wide", titleClampClass)}
        style={{
          color: resolvedTitle,
          fontFamily: titleFont,
          fontWeight: titleFontWeight ?? 400,
          fontStyle: titleFontStyle ?? "normal",
        }}
      >
        {localizedName}
      </h3>
      {display.showDescriptions && localizedDescription && (
        <p
          className={descriptionClampClass}
          style={{
            color: resolvedDescription,
            fontFamily: bodyFont,
            fontWeight: bodyFontWeight ?? 400,
            fontStyle: bodyFontStyle ?? "normal",
          }}
        >
          {localizedDescription}
        </p>
      )}
      {display.showPrices && !dish.hide_price && portionOptions && (
        <div
          className={cn(
            "mt-2 flex flex-col gap-y-1",
            !isLeftAligned && "items-center"
          )}
        >
          {portionOptions.map((option) => (
            <p
              key={`${option.label}-${option.price}`}
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
              {option.label}
              <span className="mx-1.5 opacity-50" aria-hidden>
                ·
              </span>
              {formatPrice(option.price)}
            </p>
          ))}
        </div>
      )}
      {display.showDietary && (dish.tags ?? []).length > 0 && (
        <div
          className={cn(
            "flex flex-wrap gap-2",
            isLeftAligned ? "justify-start" : "justify-center",
            isCarouselPeek && "hidden sm:flex"
          )}
        >
          {(dish?.tags ?? []).filter(Boolean).map((tag) => {
            if (!tag) return null;
            const meta = getFilterableTagMeta(tag);
            return (
              <TagBadge
                key={tag}
                icon={meta.icon}
                label={meta.label}
                textColor={resolvedTitle}
                bodyFont={bodyFont}
                bodyFontWeight={bodyFontWeight}
                bodyFontStyle={bodyFontStyle}
              />
            );
          })}
        </div>
      )}
      {display.showDietary && (dish.allergens ?? []).length > 0 && (
        <div
          className={cn(
            "flex flex-wrap gap-1.5",
            isLeftAligned ? "justify-start" : "justify-center",
            isCarouselPeek && "hidden sm:flex"
          )}
        >
          {(dish?.allergens ?? []).filter(Boolean).map((allergen) => {
            if (!allergen) return null;
            const meta = getAllergenTagMeta(allergen, allergenLocale);
            return (
              <TagBadge
                key={allergen}
                icon={meta.icon}
                label={meta.label}
                textColor={resolvedTitle}
                bodyFont={bodyFont}
                bodyFontWeight={bodyFontWeight}
                bodyFontStyle={bodyFontStyle}
                iconOnly
              />
            );
          })}
        </div>
      )}
      {display.showPrices && !dish.hide_price && !portionOptions && (
        <p
          className={cn("font-bold", isCarouselPeek ? "text-xs sm:text-sm" : "text-base")}
          style={{
            color: resolvedPrice,
            fontFamily: bodyFont,
            fontWeight: bodyFontWeight ?? 400,
            fontStyle: bodyFontStyle ?? "normal",
          }}
        >
          {formatPrice(dish.price)}
        </p>
      )}
    </div>
  );

  if (useSideImageRow) {
    return (
      <article
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          width: "100%",
        }}
        data-menulia-card="stacked-left-v3"
      >
        {display.showImages ? (
          imageBlock ?? (
            <div
              aria-hidden
              style={{
                width: "112px",
                height: "112px",
                flexShrink: 0,
                backgroundColor: "transparent",
              }}
            />
          )
        ) : null}
        <div
          style={{
            flex: "1 1 0%",
            minWidth: "0px",
            width: "100%",
            textAlign: "left",
          }}
        >
          {textBlock}
        </div>
      </article>
    );
  }

  return (
    <article
      style={{
        display: "flex",
        width: "100%",
        flexDirection: "column",
        alignItems: "center",
      }}
      data-menulia-card="carousel-v3"
    >
      {imageBlock}
      <div style={{ width: "100%", marginTop: imageBlock ? "12px" : 0 }}>{textBlock}</div>
    </article>
  );
}
