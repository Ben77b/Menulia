"use client";

import { useState } from "react";
import Image from "next/image";
import { cn, formatPrice } from "@/lib/utils";
import { getAllergenTagMeta, getFilterableTagMeta } from "@/lib/dietary-tags";
import type { PublicMenuDisplayOptions } from "@/lib/display-options";
import { resolveLocalizedText, type LocalizedTextValue } from "@/lib/localized-text";
import { normalizeImageUrl } from "@/lib/public-menu-utils";
import { hasPriceVariations, parsePriceVariationsFromDb, type PriceVariation } from "@/lib/price-variations";
import type { CategoryLayoutType } from "@/lib/category-layout";
import {
  isStackedCategoryLayout,
  isStackedLeftCategoryLayout,
  isStackedTopCategoryLayout,
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

/** Fixed image column width for stacked_left — keep spacer identical. */
const STACKED_LEFT_IMAGE_WIDTH_PX = 112;

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

  const isStackedTop = isStackedTopCategoryLayout(layout);
  const isStackedLeft = isStackedLeftCategoryLayout(layout);
  const isStackedLayout = isStackedCategoryLayout(layout);
  const isCarouselPeek = layout === "carousel" && compact;
  const isLeftAligned = isStackedLeft;

  const imageBlock =
    showImage && imageSrc ? (
      isStackedLeft ? (
        <div
          className="relative shrink-0 overflow-hidden rounded-2xl bg-transparent"
          style={{
            width: STACKED_LEFT_IMAGE_WIDTH_PX,
            height: STACKED_LEFT_IMAGE_WIDTH_PX,
            flexShrink: 0,
          }}
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover object-center"
            quality={75}
            sizes={`${STACKED_LEFT_IMAGE_WIDTH_PX}px`}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            onError={() => setImageFailed(true)}
          />
        </div>
      ) : (
        <div
          className={cn(
            "relative aspect-square shrink-0 overflow-hidden rounded-2xl bg-transparent",
            imageClassName
          )}
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover object-center"
            quality={75}
            sizes={
              layout === "carousel"
                ? "(max-width: 640px) 70vw, (max-width: 768px) 30vw, (max-width: 1200px) 25vw, 20vw"
                : "(max-width: 768px) 90vw, (max-width: 1200px) 50vw, 33vw"
            }
            priority={priority}
            loading={priority ? undefined : "lazy"}
            onError={() => setImageFailed(true)}
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
      style={
        isStackedLeft
          ? { width: "100%", maxWidth: "none", margin: 0, padding: 0 }
          : undefined
      }
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
            isStackedTop && "items-center",
            isStackedLeft && "w-full items-end"
          )}
        >
          {portionOptions.map((option) => (
            <p
              key={`${option.label}-${option.price}`}
              className={cn(
                "font-medium tabular-nums",
                isCarouselPeek ? "text-xs sm:text-sm" : "text-sm sm:text-base",
                isStackedLeft && "w-full text-right"
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
          className={cn(
            "font-bold",
            isCarouselPeek ? "text-xs sm:text-sm" : "text-base",
            isStackedLeft && "w-full text-right"
          )}
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

  if (isStackedTop) {
    return (
      <article className="flex w-full flex-col items-center justify-center gap-4">
        {imageBlock && (
          <div className="mx-auto aspect-square w-full max-w-[240px] sm:max-w-[260px]">
            {imageBlock}
          </div>
        )}
        <div className="flex w-full flex-col items-center text-center">{textBlock}</div>
      </article>
    );
  }

  if (isStackedLeft) {
    const hasImage = Boolean(imageBlock);

    return (
      <article
        className={cn(
          "flex w-full gap-4",
          hasImage ? "items-center" : "items-start"
        )}
        style={{
          display: "flex",
          width: "100%",
          height: hasImage ? undefined : "auto",
          alignItems: hasImage ? "center" : "flex-start",
          gap: 16,
        }}
      >
        {display.showImages ? (
          hasImage ? (
            imageBlock
          ) : (
            <div
              aria-hidden
              className="shrink-0 bg-transparent"
              style={{
                width: STACKED_LEFT_IMAGE_WIDTH_PX,
                flexShrink: 0,
                height: "auto",
                backgroundColor: "transparent",
              }}
            />
          )
        ) : null}
        <div
          className="text-left"
          style={{
            flexGrow: 1,
            flex: "1 1 0%",
            minWidth: 0,
            width: "100%",
            maxWidth: "none",
            marginRight: 0,
            paddingRight: 0,
          }}
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
