"use client";

import { contrastingTextColor } from "@/lib/contrast";
import type { PublicMenuSubcategory } from "@/lib/menu-hierarchy";

interface FlatCategoryNavProps {
  categories: PublicMenuSubcategory[];
  stripBackgroundColor: string;
  accentColor: string;
  activeCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
}

export function FlatCategoryNav({
  categories,
  stripBackgroundColor,
  accentColor,
  activeCategoryId,
  onCategoryChange,
}: FlatCategoryNavProps) {
  const stripTextColor = contrastingTextColor(stripBackgroundColor);
  const accentFillText = contrastingTextColor(accentColor);

  if (categories.length === 0) return null;

  return (
    <nav
      className="flex w-full flex-wrap items-center justify-center gap-2 border-b border-black/5 px-4 py-4"
      style={{
        backgroundColor: stripBackgroundColor,
        color: stripTextColor,
        justifyContent: "center",
      }}
    >
      {categories.map((category) => {
        const isActive = category.id === activeCategoryId;

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onCategoryChange(category.id)}
            className="rounded-full px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-200 sm:text-sm"
            style={
              isActive
                ? {
                    backgroundColor: accentColor,
                    color: accentFillText,
                    border: `1px solid ${accentColor}`,
                    textAlign: "center",
                  }
                : {
                    backgroundColor: "transparent",
                    color: stripTextColor,
                    border: `1px solid ${stripTextColor}`,
                    textAlign: "center",
                  }
            }
          >
            {category.name}
          </button>
        );
      })}
    </nav>
  );
}
