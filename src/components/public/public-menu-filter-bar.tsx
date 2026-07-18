"use client";

import { X } from "lucide-react";
import { contrastingTextColor } from "@/lib/contrast";
import { usePreviewCanvas } from "@/contexts/preview-canvas-context";
import { pv } from "@/lib/preview-theme-vars";
import {
  FOOTER_FILTER_TAGS,
  parseDishTag,
  type DishTagAppearance,
} from "@/lib/dietary-tags";
import { menuUiString, type PublicMenuLocale } from "@/lib/public-menu-i18n";
import { PublicMenuAllergenLegend } from "@/components/public/public-menu-allergen-legend";
import { cn } from "@/lib/utils";

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
  onClearFilters?: () => void;
  filterTags?: DishTagAppearance[];
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
  onClearFilters,
  filterTags,
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

  const tags =
    filterTags && filterTags.length > 0
      ? filterTags
      : FOOTER_FILTER_TAGS.map((filter) => parseDishTag(filter.tag));

  const hasActiveFilters = activeFilters.size > 0;

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
            {tags.map((filter) => {
              const active = activeFilters.has(filter.label);
              return (
                <button
                  key={filter.label}
                  type="button"
                  title={filter.label}
                  onClick={() => onToggleFilter(filter.label)}
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-all",
                    active && "ring-2 ring-black/10"
                  )}
                  style={
                    active
                      ? {
                          backgroundColor: filter.color,
                          color: "#171717",
                          border: `1px solid ${borderColor}`,
                          fontFamily: bodyFont,
                          fontWeight: bodyFontWeight ?? 500,
                          fontStyle: bodyFontStyle ?? "normal",
                        }
                      : {
                          backgroundColor: `${filter.color}CC`,
                          color: "#262626",
                          border: `1px solid ${filter.color}`,
                          fontFamily: bodyFont,
                          fontWeight: bodyFontWeight ?? 400,
                          fontStyle: bodyFontStyle ?? "normal",
                        }
                  }
                >
                  <span>{filter.icon}</span>
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>
          {hasActiveFilters && onClearFilters ? (
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={onClearFilters}
                className="flex cursor-pointer items-center gap-1 rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-400 transition-all hover:bg-neutral-200/60 hover:text-neutral-600"
              >
                <X className="h-3 w-3" aria-hidden />
                {menuUiString(locale, "clearFilters")}
              </button>
            </div>
          ) : null}
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
