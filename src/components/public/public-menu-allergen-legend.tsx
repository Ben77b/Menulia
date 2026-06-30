"use client";

import { ALLERGEN_TAG_OPTIONS } from "@/lib/dietary-tags";
import { menuUiString, type PublicMenuLocale } from "@/lib/public-menu-i18n";

interface PublicMenuAllergenLegendProps {
  textColor: string;
  titleFont: string;
  bodyFont: string;
  titleFontWeight?: number;
  titleFontStyle?: "normal" | "italic";
  bodyFontWeight?: number;
  bodyFontStyle?: "normal" | "italic";
  locale: PublicMenuLocale;
  className?: string;
}

export function PublicMenuAllergenLegend({
  textColor,
  titleFont,
  bodyFont,
  titleFontWeight,
  titleFontStyle,
  bodyFontWeight,
  bodyFontStyle,
  locale,
  className = "",
}: PublicMenuAllergenLegendProps) {
  return (
    <div className={`w-full ${className}`.trim()} style={{ color: textColor, textAlign: "center" }}>
      <h3
        className="mb-3 text-xs font-bold uppercase tracking-[0.2em]"
        style={{
          fontFamily: titleFont,
          fontWeight: titleFontWeight ?? 400,
          fontStyle: titleFontStyle ?? "normal",
          color: textColor,
        }}
      >
        {menuUiString(locale, "allergens")}
      </h3>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {ALLERGEN_TAG_OPTIONS.map(({ tag, icon }) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 text-xs"
            style={{
              fontFamily: bodyFont,
              fontWeight: bodyFontWeight ?? 400,
              fontStyle: bodyFontStyle ?? "normal",
              color: textColor,
            }}
          >
            <span aria-hidden>{icon}</span>
            <span>{tag}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
