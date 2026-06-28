"use client";

import { contrastingTextColor } from "@/lib/contrast";
import { FOOTER_FILTER_TAGS, getTagMeta } from "@/lib/dietary-tags";
import { menuUiString, type PublicMenuLocale } from "@/lib/public-menu-i18n";

interface PublicMenuFilterBarProps {
  backgroundColor: string;
  titleFont: string;
  bodyFont: string;
  locale: PublicMenuLocale;
  activeFilters: Set<string>;
  onToggleFilter: (tag: string) => void;
  menuTags: string[];
}

export function PublicMenuFilterBar({
  backgroundColor,
  titleFont,
  bodyFont,
  locale,
  activeFilters,
  onToggleFilter,
  menuTags,
}: PublicMenuFilterBarProps) {
  const textColor = contrastingTextColor(backgroundColor);

  if (menuTags.length === 0 && FOOTER_FILTER_TAGS.length === 0) {
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
            style={{ fontFamily: titleFont, color: textColor, textAlign: "center" }}
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
                          border: `1px solid ${textColor}`,
                        }
                      : {
                          backgroundColor: "transparent",
                          color: textColor,
                          border: `1px solid ${textColor}`,
                        }
                  }
                >
                  <span>{filter.icon}</span>
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {menuTags.length > 0 && (
          <div className="mt-8 w-full space-y-3">
            <h3
              className="text-sm font-bold uppercase tracking-[0.2em]"
              style={{ fontFamily: titleFont, color: textColor, textAlign: "center" }}
            >
              {menuUiString(locale, "tagLegend")}
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {menuTags.map((tag) => {
                const meta = getTagMeta(tag);
                return (
                  <span
                    key={tag}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                    style={{
                      color: textColor,
                      border: `1px solid ${textColor}`,
                      fontFamily: bodyFont,
                    }}
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
