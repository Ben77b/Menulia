"use client";

import { contrastingTextColor } from "@/lib/contrast";
import { usePreviewCanvas } from "@/contexts/preview-canvas-context";
import { pv } from "@/lib/preview-theme-vars";
import { FOOTER_FILTER_TAGS } from "@/lib/dietary-tags";
import { menuUiString, type PublicMenuLocale } from "@/lib/public-menu-i18n";
import { PublicMenuAllergenLegend } from "@/components/public/public-menu-allergen-legend";

interface PublicMenuFilterBarProps {
  backgroundColor: string;
  textColor?: string;
  borderColor?: string;
  titleFont: string;
  bodyFont: string;
  titleFontWeight?: number;
  titleFontStyle?: "normal" | "italic";
  bodyFontWeight?: number;
  bodyFontStyle?: "normal" | "italic";
  locale: PublicMenuLocale;
  activeFilters: Set<string>;
  onToggleFilter: (tag: string) => void;
}

export function PublicMenuFilterBar({
  backgroundColor,
  textColor: textColorProp,
  borderColor: borderColorProp,
  titleFont,
  bodyFont,
  titleFontWeight,
  titleFontStyle,
  bodyFontWeight,
  bodyFontStyle,
  locale,
  activeFilters,
  onToggleFilter,
}: PublicMenuFilterBarProps) {
  const isPreview = usePreviewCanvas();
  const textColor =
    isPreview && textColorProp
      ? textColorProp
      : isPreview
        ? pv("filterText")
        : textColorProp ?? contrastingTextColor(backgroundColor);
  const borderColor =
    isPreview && borderColorProp
      ? borderColorProp
      : isPreview
        ? pv("filterBorder")
        : borderColorProp ?? textColor;

  return (
    <section
      className="border-t border-black/5 px-6 py-10"
      style={{ backgroundColor, color: textColor }}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
        <div className="w-full space-y-3">
          <h3
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{
              fontFamily: titleFont,
              fontWeight: titleFontWeight ?? 400,
              fontStyle: titleFontStyle ?? "normal",
              color: textColor,
              textAlign: "center",
            }}
          >
            {menuUiString(locale, "filterTitle")}
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {FOOTER_FILTER_TAGS.map((filter) => {
              const active = activeFilters.has(filter.tag);
              return (
                <button
                  key={filter.tag}
                  type="button"
                  title={filter.label}
                  onClick={() => onToggleFilter(filter.tag)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-all"
                  style={
                    active
                      ? {
                          backgroundColor: textColor,
                          color: backgroundColor,
                          border: `1px solid ${borderColor}`,
                        }
                      : {
                          backgroundColor: "transparent",
                          color: textColor,
                          border: `1px solid ${borderColor}`,
                        }
                  }
                >
                  <span>{filter.icon}</span>
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>
          <PublicMenuAllergenLegend
            textColor={textColor}
            titleFont={titleFont}
            bodyFont={bodyFont}
            titleFontWeight={titleFontWeight}
            titleFontStyle={titleFontStyle}
            bodyFontWeight={bodyFontWeight}
            bodyFontStyle={bodyFontStyle}
            locale={locale}
            className="mt-6"
          />
        </div>
      </div>
    </section>
  );
}
