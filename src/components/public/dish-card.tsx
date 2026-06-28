"use client";

import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { DIETARY_ICONS } from "@/lib/dietary-tags";

export interface PublicMenuDish {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  tags: string[];
}

interface DishCardProps {
  dish: PublicMenuDish;
  titleFont: string;
  bodyFont: string;
  textColor: string;
  accentColor: string;
  layout?: "carousel" | "stacked";
  compact?: boolean;
  imageClassName?: string;
}

export function DishCard({
  dish,
  titleFont,
  bodyFont,
  textColor,
  accentColor,
  layout = "carousel",
  compact = false,
  imageClassName = "w-full max-w-xs",
}: DishCardProps) {
  const imageBlock = dish.image ? (
    <div className={`relative aspect-square overflow-hidden rounded-2xl ${imageClassName}`}>
      <Image
        src={dish.image}
        alt={dish.name}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 80vw, 320px"
      />
    </div>
  ) : (
    <div
      className={`flex aspect-square items-center justify-center rounded-2xl bg-black/5 ${imageClassName}`}
      style={{ color: textColor }}
    >
      <span className="text-sm opacity-60">No image</span>
    </div>
  );

  const textBlock = (
    <div className={`space-y-2 ${layout === "carousel" ? "text-center" : "md:text-left text-center"}`}>
      <h3
        className={`font-semibold uppercase leading-tight tracking-wide ${compact ? "text-sm" : "text-base sm:text-lg"}`}
        style={{ color: textColor, fontFamily: titleFont }}
      >
        {dish.name}
      </h3>
      {dish.description && (
        <p
          className={`leading-relaxed opacity-90 ${compact ? "line-clamp-2 text-xs" : "text-sm"}`}
          style={{ color: textColor, fontFamily: bodyFont }}
        >
          {dish.description}
        </p>
      )}
      {dish.tags.length > 0 && (
        <div className={`flex flex-wrap gap-2 ${layout === "carousel" ? "justify-center" : "justify-center md:justify-start"}`}>
          {dish.tags.map((tag) => {
            const meta = DIETARY_ICONS[tag];
            return (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                style={{
                  color: textColor,
                  border: `1px solid ${accentColor}`,
                  fontFamily: bodyFont,
                }}
              >
                {meta?.icon && <span>{meta.icon}</span>}
                {meta?.label ?? tag}
              </span>
            );
          })}
        </div>
      )}
      <p
        className={`font-bold ${compact ? "text-sm" : "text-base"}`}
        style={{ color: textColor, fontFamily: bodyFont }}
      >
        {formatPrice(dish.price)}
      </p>
    </div>
  );

  if (layout === "stacked") {
    return (
      <article className="flex flex-col items-center gap-4 md:flex-row md:items-start md:gap-6">
        <div className="w-full max-w-sm shrink-0 md:w-48">{imageBlock}</div>
        <div className="w-full max-w-xl flex-1">{textBlock}</div>
      </article>
    );
  }

  return (
    <article className="flex flex-col">
      {imageBlock}
      <div className="mt-4">{textBlock}</div>
    </article>
  );
}
