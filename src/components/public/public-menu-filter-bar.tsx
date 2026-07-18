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

const FILTER_CHIP_CLASS =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-neutral-200/60 bg-transparent px-3 py-2 text-xs font-medium text-neutral-800 transition-all";

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
  filterTags,
}: PublicMenuFilterBarProps) {
  const isPreview = usePreviewCanvas();
  const textColor =
    isPreview && textColorProp
      ? textColorProp
      : isPreview
        ? pv("filterText")
        : textColorProp ?? contrastingTextColor(backgroundColor);

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
                      active && "border-neutral-400 ring-1 ring-neutral-300/70"
                    )}
                    style={{
                      fontFamily: bodyFont,
                      fontWeight: bodyFontWeight ?? (active ? 500 : 400),
                      fontStyle: bodyFontStyle ?? "normal",
                    }}
                  >
                    <span>{filter.icon}</span>
                    <span>{filter.label}</span>
                  </button>
                );
              })}
            </div>
            {hasActiveFilters && onClearFilters ? (
              <button
                type="button"
                onClick={onClearFilters}
                className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-neutral-200/60 bg-transparent px-2 py-1 text-xs font-medium text-neutral-400 transition-all hover:border-neutral-300 hover:text-neutral-600"
              >
                <X className="h-3 w-3" aria-hidden />
                {menuUiString(locale, "clearFilters")}
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
