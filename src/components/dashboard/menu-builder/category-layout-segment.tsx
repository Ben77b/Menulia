"use client";

import { useDashboardLocale } from "@/contexts/dashboard-locale-context";
import {
  CATEGORY_LAYOUT_OPTIONS,
  normalizeCategoryLayoutType,
  type CategoryLayoutType,
} from "@/lib/category-layout";
import { cn } from "@/lib/utils";

interface CategoryLayoutSegmentProps {
  value: CategoryLayoutType | string | null | undefined;
  onChange: (layout: CategoryLayoutType) => void;
  disabled?: boolean;
  className?: string;
}

export function CategoryLayoutSegment({
  value,
  onChange,
  disabled = false,
  className,
}: CategoryLayoutSegmentProps) {
  const { t } = useDashboardLocale();
  const selected = normalizeCategoryLayoutType(value);
  const selectedIndex = Math.max(
    0,
    CATEGORY_LAYOUT_OPTIONS.findIndex((option) => option.value === selected)
  );
  const optionCount = CATEGORY_LAYOUT_OPTIONS.length;

  return (
    <div className={cn("space-y-2", className)}>
      <p className="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        {t("builder.layout.label")}
      </p>
      <div
        role="radiogroup"
        aria-label={t("builder.layout.label")}
        className="relative rounded-[10px] bg-neutral-100 p-0.5"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0.5 top-0.5 rounded-[8px] bg-white shadow-sm transition-transform duration-200 ease-out"
          style={{
            width: `calc((100% - 4px) / ${optionCount})`,
            transform: `translateX(calc(${selectedIndex} * 100%))`,
          }}
        />
        <div className="relative grid grid-cols-3">
          {CATEGORY_LAYOUT_OPTIONS.map((option) => {
            const isSelected = selected === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={disabled}
                onClick={() => {
                  if (!isSelected) onChange(option.value);
                }}
                className={cn(
                  "relative z-10 min-h-11 rounded-[8px] px-2 py-2.5 text-center text-xs font-semibold transition-colors sm:text-sm",
                  isSelected ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-700",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                {t(option.labelKey)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
