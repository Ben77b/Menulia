"use client";

import { X } from "lucide-react";
import { contrastingTextColor } from "@/lib/contrast";
import { usePreviewCanvas } from "@/contexts/preview-canvas-context";
import { pv } from "@/lib/preview-theme-vars";
import { type DishTagAppearance } from "@/lib/dietary-tags";
import { menuUiString, type PublicMenuLocale } from "@/lib/public-menu-i18n";
import { PublicMenuAllergenLegend } from "@/components/public/public-menu-allergen-legend";
import { cn } from "@/lib/utils";

const MAX_VISIBLE_FILTER_TAGS = 10;

const FILTER_CHIP_CLASS =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-current/25 bg-transparent px-3 py-2 text-xs font-medium text-current transition-all duration-300 ease-out hover:scale-[1.02] hover:opacity-80 hover:border-current/40 dark:border-white/20 dark:hover:border-white/35";

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
  filterTags = [],
}: PublicMenuFilterBarProps) {
  const isPreview = usePreviewCanvas();
  const textColor =
    isPreview && textColorProp
      ? textColorProp
      : isPreview
        ? pv("filterText")
        : textColorProp ?? contrastingTextColor(backgroundColor);

  const tags = filterTags.slice(0, MAX_VISIBLE_FILTER_TAGS);
  const hasActiveFilters = activeFilters.size > 0;

  if (tags.length === 0) {
    return null;
  }

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
          <div className="flex w-full flex-row items-center justify-center gap-3">
            <div className="flex min-w-0 flex-1 flex-row flex-wrap items-center justify-center gap-2 overflow-x-auto sm:flex-nowrap">
              {tags.map((filter) => {
                const active = activeFilters.has(filter.label);
                return (
                  <button
                    key={filter.label}
                    type="button"
                    title={filter.label}
                    onClick={() => onToggleFilter(filter.label)}
                    className={cn(
                      FILTER_CHIP_CLASS,
                      active &&
                        "border-current/55 font-semibold opacity-100 ring-1 ring-current/25 hover:opacity-100 hover:scale-100"
                    )}
                    style={{
                      fontFamily: bodyFont,
                      fontWeight: bodyFontWeight ?? (active ? 600 : 400),
                      fontStyle: bodyFontStyle ?? "normal",
                      color: textColor,
                    }}
                  >
                    <span>{filter.icon}</span>
                    <span>{filter.label}</span>
                  </button>
                );
              })}
            </div>
            {onClearFilters ? (
              <button
                type="button"
                onClick={onClearFilters}
                aria-hidden={!hasActiveFilters}
                tabIndex={hasActiveFilters ? 0 : -1}
                className={cn(
                  "shrink-0 bg-transparent p-0 text-xs font-medium transition-all duration-300 ease-in-out",
                  hasActiveFilters
                    ? "pointer-events-auto opacity-100"
                    : "pointer-events-none opacity-0"
                )}
                style={{ color: textColor }}
              >
                <span className="inline-flex items-center gap-1 opacity-60 transition-opacity duration-300 ease-out hover:opacity-100">
                  <X className="h-3 w-3" aria-hidden />
                  {menuUiString(locale, "clearFilters")}
                </span>
              </button>
            ) : null}
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
