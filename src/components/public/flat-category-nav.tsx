"use client";

import { contrastingTextColor } from "@/lib/contrast";
import { usePreviewCanvas } from "@/contexts/preview-canvas-context";
import { pv } from "@/lib/preview-theme-vars";
import type { PublicMenuSubcategory } from "@/lib/menu-hierarchy";
import { resolveLocalizedText } from "@/lib/localized-text";

interface FlatCategoryNavProps {
  categories: PublicMenuSubcategory[];
  stripBackgroundColor: string;
  tier2ActiveBg: string;
  tier2ActiveText: string;
  tier2ActiveBorder: string;
  tier2InactiveBg: string;
  tier2InactiveText: string;
  tier2InactiveBorder: string;
  categoryFont: string;
  categoryFontWeight?: number;
  categoryFontStyle?: "normal" | "italic";
  activeCategoryId: string;
  lang?: string;
  fallbackLang?: string;
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
  categoryFont,
  categoryFontWeight,
  categoryFontStyle,
  activeCategoryId,
  lang = "en",
  fallbackLang = "en",
  onCategoryChange,
}: FlatCategoryNavProps) {
  const isPreview = usePreviewCanvas();
  const stripTextColor = isPreview ? pv("inactiveTabText") : contrastingTextColor(stripBackgroundColor);
  const categoryTypeStyle = {
    fontFamily: categoryFont,
    fontWeight: categoryFontWeight ?? 400,
    fontStyle: categoryFontStyle ?? "normal",
  } as const;

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
            className="max-w-[12rem] rounded-full px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-200 sm:max-w-[14rem] sm:text-sm"
            style={
              isActive
                ? {
                    ...categoryTypeStyle,
                    backgroundColor: tier2ActiveBg,
                    color: tier2ActiveText,
                    border: `1px solid ${tier2ActiveBorder}`,
                    textAlign: "center",
                  }
                : {
                    ...categoryTypeStyle,
                    backgroundColor: tier2InactiveBg,
                    color: tier2InactiveText,
                    border: `1px solid ${tier2InactiveBorder}`,
                    textAlign: "center",
                  }
            }
          >
            <span className="line-clamp-2 break-words">
              {resolveLocalizedText(category.name, lang, fallbackLang)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
