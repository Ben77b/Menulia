"use client";

import { GripVertical, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { InlineSaveField } from "./inline-save-field";
import { ReorderButtons } from "./reorder-buttons";
import type { MenuBuilderDish } from "@/lib/menu-builder-types";
import type { MenuContentLanguage } from "@/lib/menu-content-languages";
import { MAX_DISH_NAME } from "@/lib/menu-limits";
import { resolveBuilderSourceText } from "@/lib/localized-text";

function DishStatusDot({ dish }: { dish: MenuBuilderDish }) {
  const live = dish.is_available !== false;
  return (
    <span
      className={cn(
        "h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white",
        live ? "bg-emerald-500" : "bg-neutral-400"
      )}
      title={live ? "Live on menu" : "Hidden from menu"}
      aria-hidden
    />
  );
}

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
  tapForDetailsLabel: string;
}) {
  const name = resolveBuilderSourceText(dish.name, primaryLanguage) || "Untitled dish";
  const subtitle = dish.description
    ? resolveBuilderSourceText(dish.description, primaryLanguage)
    : tapForDetailsLabel;

  return (
    <div
      className={cn(
        "group flex min-h-[52px] items-center gap-2 border-b border-neutral-200/60 px-3 py-2 transition-all duration-200 ease-in-out last:border-b-0",
        selected
          ? "bg-neutral-900/[0.03] ring-1 ring-inset ring-neutral-900/10"
          : "bg-white hover:bg-neutral-50/80"
      )}
    >
      <div className="flex min-h-11 min-w-11 shrink-0 items-center justify-center text-neutral-400">
        {reorderMode ? (
          <GripVertical className="h-4 w-4" aria-hidden />
        ) : (
          <GripVertical className="h-4 w-4 opacity-30" aria-hidden />
        )}
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

      <DishStatusDot dish={dish} />

      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 py-2 text-left"
      >
        <div className="flex min-w-0 items-center gap-2">
          <InlineSaveField
            value={name}
            placeholder="Untitled dish"
            maxLength={MAX_DISH_NAME}
            disabled={busy}
            ariaLabel={`Edit ${name}`}
            textClassName="text-sm font-semibold text-neutral-900"
            onSave={onInlineNameUpdate}
            onClick={(e) => e.stopPropagation()}
          />
          {dish.is_available === false && (
            <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500">
              {hiddenLabel}
            </span>
          )}
        </div>
        <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">{subtitle}</p>
      </button>

      <InlineSaveField
        value={(dish.price ?? 0).toFixed(2)}
        displayValue={`€${(dish.price ?? 0).toFixed(2)}`}
        inputMode="decimal"
        disabled={busy}
        ariaLabel={`Edit price for ${name}`}
        textClassName="inline-flex min-h-11 items-center rounded-lg border border-neutral-200/60 bg-neutral-50 px-2.5 text-sm font-semibold tabular-nums text-neutral-800"
        inputClassName="w-20 text-right text-sm font-semibold tabular-nums"
        onSave={onInlinePriceUpdate}
      />

      <button
        type="button"
        role="switch"
        aria-checked={dish.is_available !== false}
        aria-label={dish.is_available !== false ? "Hide from menu" : "Show on menu"}
        disabled={busy}
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility();
        }}
        className={cn(
          "inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-neutral-200/60 transition-all duration-200 ease-in-out",
          dish.is_available !== false
            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200/80"
        )}
      >
        <span className="text-[10px] font-bold uppercase tracking-wide">
          {dish.is_available !== false ? "On" : "Off"}
        </span>
      </button>

      <button
        type="button"
        onClick={onSelect}
        aria-label={editLabel}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-neutral-200/60 bg-white text-neutral-600 transition-all duration-200 ease-in-out hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  );
}
