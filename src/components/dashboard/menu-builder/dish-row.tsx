"use client";

import Image from "next/image";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReorderButtons } from "./reorder-buttons";
import type { MenuBuilderDish } from "@/lib/menu-builder-types";
import type { MenuContentLanguage } from "@/lib/menu-content-languages";
import { resolveBuilderSourceText } from "@/lib/localized-text";
import { normalizeImageUrl } from "@/lib/public-menu-utils";
import { hasPriceVariations } from "@/lib/price-variations";

export function DishRow({
  dish,
  primaryLanguage,
  busy,
  selected,
  dishIndex,
  dishCount,
  reorderMode,
  onEdit,
  onDelete,
  onMoveDish,
  editLabel,
  deleteLabel,
  hiddenLabel,
}: {
  dish: MenuBuilderDish;
  primaryLanguage: MenuContentLanguage;
  busy: boolean;
  selected: boolean;
  dishIndex: number;
  dishCount: number;
  reorderMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveDish: (direction: -1 | 1) => void;
  editLabel: string;
  deleteLabel: string;
  hiddenLabel: string;
}) {
  const name = resolveBuilderSourceText(dish.name, primaryLanguage) || "Untitled dish";
  const imageSrc = normalizeImageUrl(dish.image_url);
  const isVisible = dish.is_available !== false;
  const hasVariations = hasPriceVariations(dish.price_variations);
  const priceLabel = dish.hide_price
    ? null
    : hasVariations
      ? `from €${(dish.price ?? 0).toFixed(2)}`
      : `€${(dish.price ?? 0).toFixed(2)}`;

  return (
    <div
      className={cn(
        "group flex min-h-[72px] items-center gap-4 px-4 py-4 transition-colors sm:px-5",
        selected ? "bg-sky-50/50" : "bg-white hover:bg-neutral-50/60"
      )}
    >
      {reorderMode ? (
        <>
          <div className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500">
            <GripVertical className="h-5 w-5" aria-hidden />
          </div>
          <ReorderButtons
            mobileEnabled
            touchAlwaysVisible
            onMoveUp={() => onMoveDish(-1)}
            onMoveDown={() => onMoveDish(1)}
            canMoveUp={dishIndex > 0}
            canMoveDown={dishIndex < dishCount - 1}
            disabled={busy}
          />
        </>
      ) : null}

      {imageSrc ? (
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
          <Image src={imageSrc} alt="" fill className="object-cover" sizes="48px" />
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-base font-medium text-neutral-900",
            !isVisible && "text-neutral-400"
          )}
        >
          {name}
        </p>
        {!isVisible ? (
          <p className="mt-0.5 text-xs text-neutral-400">{hiddenLabel}</p>
        ) : null}
      </div>

      {priceLabel ? (
        <span className="shrink-0 text-base font-semibold tabular-nums text-neutral-700">
          {priceLabel}
        </span>
      ) : null}

      {!reorderMode ? (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            disabled={busy}
            aria-label={editLabel}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 active:bg-neutral-200/70"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            aria-label={deleteLabel}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-neutral-300 transition-colors hover:bg-red-50 hover:text-red-600 active:bg-red-100/70"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
