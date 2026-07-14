"use client";

import { GripVertical, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { InlineSaveField } from "./inline-save-field";
import { ReorderButtons } from "./reorder-buttons";
import type { MenuBuilderDish } from "@/lib/menu-builder-types";
import type { MenuContentLanguage } from "@/lib/menu-content-languages";
import { MAX_DISH_NAME } from "@/lib/menu-limits";
import { resolveBuilderSourceText } from "@/lib/localized-text";

export function DishRow({
  dish,
  primaryLanguage,
  busy,
  selected,
  dishIndex,
  dishCount,
  reorderMode,
  onSelect,
  onToggleVisibility,
  onInlineNameUpdate,
  onInlinePriceUpdate,
  onMoveDish,
  editLabel,
  hiddenLabel,
  visibleLabel,
  tapForDetailsLabel,
}: {
  dish: MenuBuilderDish;
  primaryLanguage: MenuContentLanguage;
  busy: boolean;
  selected: boolean;
  dishIndex: number;
  dishCount: number;
  reorderMode: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onInlineNameUpdate: (nextName: string) => Promise<boolean>;
  onInlinePriceUpdate: (nextPrice: string) => Promise<boolean>;
  onMoveDish: (direction: -1 | 1) => void;
  editLabel: string;
  hiddenLabel: string;
  visibleLabel: string;
  tapForDetailsLabel: string;
}) {
  const name = resolveBuilderSourceText(dish.name, primaryLanguage) || "Untitled dish";
  const subtitle = dish.description
    ? resolveBuilderSourceText(dish.description, primaryLanguage)
    : tapForDetailsLabel;
  const isVisible = dish.is_available !== false;

  return (
    <div
      className={cn(
        "group flex min-h-[56px] items-center gap-2 border-b border-neutral-200/60 px-4 py-2.5 transition-all duration-200 ease-in-out last:border-b-0",
        selected
          ? "bg-sky-50/60 ring-1 ring-inset ring-sky-200/80"
          : "bg-white hover:bg-neutral-50/80"
      )}
    >
      <div className="flex min-h-11 min-w-11 shrink-0 items-center justify-center text-neutral-300">
        <GripVertical className={cn("h-4 w-4", reorderMode ? "text-neutral-400" : "opacity-40")} aria-hidden />
      </div>

      <ReorderButtons
        revealOnHover
        mobileEnabled={reorderMode}
        onMoveUp={() => onMoveDish(-1)}
        onMoveDown={() => onMoveDish(1)}
        canMoveUp={dishIndex > 0}
        canMoveDown={dishIndex < dishCount - 1}
        disabled={busy}
      />

      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center py-2 text-left">
        <div className="min-w-0">
          <InlineSaveField
            value={name}
            placeholder="Untitled dish"
            maxLength={MAX_DISH_NAME}
            disabled={busy}
            ariaLabel={`Edit ${name}`}
            textClassName="text-sm font-semibold text-neutral-800"
            onSave={onInlineNameUpdate}
            onClick={(e) => e.stopPropagation()}
          />
          <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">{subtitle}</p>
        </div>
      </button>

      <InlineSaveField
        value={(dish.price ?? 0).toFixed(2)}
        displayValue={`€${(dish.price ?? 0).toFixed(2)}`}
        inputMode="decimal"
        disabled={busy}
        ariaLabel={`Edit price for ${name}`}
        textClassName="inline-flex min-h-11 shrink-0 items-center rounded-xl border border-neutral-200/60 bg-neutral-50/80 px-3 text-sm font-semibold tabular-nums text-neutral-700"
        inputClassName="w-20 text-right text-sm font-semibold tabular-nums"
        onSave={onInlinePriceUpdate}
      />

      <button
        type="button"
        role="switch"
        aria-checked={isVisible}
        aria-label={isVisible ? "Hide from menu" : "Show on menu"}
        disabled={busy}
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility();
        }}
        className={cn(
          "inline-flex min-h-11 shrink-0 items-center justify-center rounded-full px-3.5 transition-all duration-200 ease-in-out",
          isVisible
            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70 hover:bg-emerald-100"
            : "bg-neutral-100 text-neutral-500 ring-1 ring-neutral-200/70 hover:bg-neutral-200/70"
        )}
      >
        <span className="text-[11px] font-medium">{isVisible ? visibleLabel : hiddenLabel}</span>
      </button>

      <button
        type="button"
        onClick={onSelect}
        aria-label={editLabel}
        className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200/60 bg-white text-neutral-500 transition-all duration-200 ease-in-out hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  );
}
