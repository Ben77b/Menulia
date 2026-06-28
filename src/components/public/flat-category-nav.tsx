"use client";

import { contrastingTextColor } from "@/lib/contrast";
import type { PublicMenuSubcategory } from "@/lib/menu-hierarchy";

interface FlatCategoryNavProps {
  categories: PublicMenuSubcategory[];
  stripBackgroundColor: string;
  tier2ActiveBg: string;
  tier2ActiveText: string;
  tier2ActiveBorder: string;
  tier2InactiveBg: string;
  tier2InactiveText: string;
  tier2InactiveBorder: string;
  activeCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
}

export function FlatCategoryNav({
  categories,
  stripBackgroundColor,
  tier2ActiveBg,
  tier2ActiveText,
  tier2ActiveBorder,
  tier2InactiveBg,
  tier2InactiveText,
  tier2InactiveBorder,
  activeCategoryId,
  onCategoryChange,
}: FlatCategoryNavProps) {
  const stripTextColor = contrastingTextColor(stripBackgroundColor);

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
                    backgroundColor: tier2ActiveBg,
                    color: tier2ActiveText,
                    border: `1px solid ${tier2ActiveBorder}`,
                    textAlign: "center",
                  }
                : {
                    backgroundColor: tier2InactiveBg,
                    color: tier2InactiveText,
                    border: `1px solid ${tier2InactiveBorder}`,
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
