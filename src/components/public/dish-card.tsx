"use client";

import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { getAllergenTagMeta, getFilterableTagMeta } from "@/lib/dietary-tags";
import type { PublicMenuDisplayOptions } from "@/lib/display-options";

export interface PublicMenuDish {
  id: string;
  name: string;
  description: string;
  price: number;
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
  layout?: "carousel" | "stacked";
  compact?: boolean;
  imageClassName?: string;
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
}: DishCardProps) {
  const showImage = display.showImages && Boolean(dish.image);

  const resolvedTitle = titleColor ?? textColor;
  const resolvedDescription = descriptionColor ?? textColor;
  const resolvedPrice = priceColor ?? textColor;

  const imageAlt = `${dish.name} at ${restaurantName}`;

  const imageBlock =
    showImage && dish.image ? (
      <div className={`relative aspect-square overflow-hidden rounded-2xl ${imageClassName}`}>
        <Image
          src={dish.image}
          alt={imageAlt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 80vw, 320px"
          loading="lazy"
        />
      </div>
    ) : null;

  const textBlock = (
    <div className="space-y-2 text-center">
      <h3
        className={`font-semibold uppercase leading-tight tracking-wide ${compact ? "text-sm" : "text-base sm:text-lg"}`}
        style={{
          color: resolvedTitle,
          fontFamily: titleFont,
          fontWeight: titleFontWeight ?? 400,
          fontStyle: titleFontStyle ?? "normal",
        }}
      >
        {dish.name}
      </h3>
      {display.showDescriptions && dish.description && (
        <p
          className={`leading-relaxed ${compact ? "line-clamp-2 text-xs" : "text-sm"}`}
          style={{
            color: resolvedDescription,
            fontFamily: bodyFont,
            fontWeight: bodyFontWeight ?? 400,
            fontStyle: bodyFontStyle ?? "normal",
          }}
        >
          {dish.description}
        </p>
      )}
      {display.showDietary && (dish.tags ?? []).length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {(dish.tags ?? []).map((tag) => {
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
        <div className="flex flex-wrap justify-center gap-1.5">
          {(dish.allergens ?? []).map((allergen) => {
            const meta = getAllergenTagMeta(allergen);
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
      {display.showPrices && !dish.hide_price && (
        <p
          className={`font-bold ${compact ? "text-sm" : "text-base"}`}
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

  if (layout === "stacked") {
    return (
      <article
        className={`flex flex-col gap-4 text-center ${imageBlock ? "items-center" : "w-full items-stretch"}`}
      >
        {imageBlock && <div className="w-full max-w-sm shrink-0">{imageBlock}</div>}
        <div className={imageBlock ? "w-full max-w-xl flex-1" : "w-full flex-1"}>{textBlock}</div>
      </article>
    );
  }

  return (
    <article className={`flex flex-col ${imageBlock ? "" : "w-full"}`}>
      {imageBlock}
      <div className={imageBlock ? "mt-4" : "w-full"}>{textBlock}</div>
    </article>
  );
}
