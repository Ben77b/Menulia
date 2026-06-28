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
  imageClassName?: string;
}

export function DishCard({
  dish,
  titleFont,
  bodyFont,
  textColor,
  accentColor,
  imageClassName = "w-full max-w-xs",
}: DishCardProps) {
  return (
    <article className="flex flex-col">
      {dish.image ? (
        <div className={`relative aspect-square overflow-hidden rounded-2xl ${imageClassName}`}>
          <Image src={dish.image} alt={dish.name} fill className="object-cover" sizes="(max-width: 768px) 80vw, 320px" />
        </div>
      ) : (
        <div
          className={`flex aspect-square items-center justify-center rounded-2xl bg-black/5 ${imageClassName}`}
          style={{ color: textColor }}
        >
          <span className="text-sm opacity-60">No image</span>
        </div>
      )}

      <div className="mt-4 space-y-2">
        <h3 className="text-lg font-semibold leading-tight" style={{ color: textColor, fontFamily: titleFont }}>
          {dish.name}
        </h3>
        <p className="text-base font-bold" style={{ color: accentColor, fontFamily: bodyFont }}>
          {formatPrice(dish.price)}
        </p>
        {dish.description && (
          <p className="text-sm leading-relaxed opacity-90" style={{ color: textColor, fontFamily: bodyFont }}>
            {dish.description}
          </p>
        )}
        {dish.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
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
      </div>
    </article>
  );
}
