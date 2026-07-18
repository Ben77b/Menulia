"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardLocale } from "@/contexts/dashboard-locale-context";
import { cn } from "@/lib/utils";
import type { MenuBuilderDish } from "@/lib/menu-builder-types";
import type { MenuContentLanguage } from "@/lib/menu-content-languages";
import { resolveBuilderSourceText } from "@/lib/localized-text";
import { DishDetailForm } from "./dish-detail-form";
import { useDishDetailDraft } from "./use-dish-detail-draft";
import type { DishDetailDraft } from "./dish-detail-types";

interface DishDetailInspectorProps {
  dish: MenuBuilderDish | null;
  mode?: "create" | "edit";
  primaryLanguage: MenuContentLanguage;
  saving?: boolean;
  uploadingImage?: boolean;
  restaurantName?: string;
  categoryName?: string;
  onClose: () => void;
  onSave: (draft: DishDetailDraft) => Promise<void>;
  onDelete?: () => void;
  onImageUpload: (file: File) => Promise<string | null>;
  onAvailabilityChange?: (isAvailable: boolean) => Promise<void>;
  className?: string;
  menuTagSuggestions?: readonly { tag: string; label?: string; icon?: string }[];
}

export function DishDetailInspector({
  dish,
  mode = dish ? "edit" : "create",
  primaryLanguage,
  saving,
  uploadingImage,
  restaurantName,
  categoryName,
  onClose,
  onSave,
  onDelete,
  onImageUpload,
  onAvailabilityChange,
  className,
  menuTagSuggestions = [],
}: DishDetailInspectorProps) {
  const { t } = useDashboardLocale();
  const isCreate = mode === "create";
  const {
    draft,
    setDraft,
    addPriceVariation,
    updatePriceVariation,
    removePriceVariation,
    setUsePriceVariations,
    setFilterableTags,
    toggleAllergen,
  } = useDishDetailDraft(dish, primaryLanguage, true);

  const dishName = isCreate
    ? draft.name.trim() || t("dish.addTitle")
    : resolveBuilderSourceText(dish?.name, primaryLanguage) || "Untitled dish";

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-l border-neutral-200/60 bg-white shadow-[-12px_0_40px_rgba(15,23,42,0.08)] transition-all duration-200 ease-in-out",
        className
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200/60 bg-gradient-to-r from-white to-sky-50/40 px-5 py-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-sky-600/80">
            {isCreate ? t("dish.addTitle") : t("dish.editTitle")}
          </p>
          <h2 className="truncate text-lg font-semibold text-neutral-800">{dishName}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close editor"
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200/60 bg-white text-neutral-500 transition-all duration-200 ease-in-out hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-800"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-neutral-50/30 px-5 py-5 pb-32">
        <DishDetailForm
          draft={draft}
          setDraft={setDraft}
          primaryLanguage={primaryLanguage}
          saving={saving}
          uploadingImage={uploadingImage}
          onImageUpload={onImageUpload}
          onAvailabilityChange={onAvailabilityChange}
          restaurantName={restaurantName}
          categoryName={categoryName}
          addPriceVariation={addPriceVariation}
          updatePriceVariation={updatePriceVariation}
          removePriceVariation={removePriceVariation}
          setUsePriceVariations={setUsePriceVariations}
          setFilterableTags={setFilterableTags}
          toggleAllergen={toggleAllergen}
          menuTagSuggestions={menuTagSuggestions}
        />
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-neutral-200/60 bg-white px-5 py-4">
        <div className="min-w-0">
          {!isCreate && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={saving}
              className="inline-flex min-h-11 items-center px-1 text-sm font-medium text-red-600 transition-colors hover:text-red-700 disabled:opacity-50"
            >
              {t("dish.delete")}
            </button>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-800"
          >
            {t("dish.cancel")}
          </button>
          <Button
            disabled={saving || !draft.name.trim()}
            onClick={() => onSave(draft)}
            className="min-h-11 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-zinc-800"
          >
            {saving
              ? isCreate
                ? t("dish.creating")
                : t("dish.saving")
              : isCreate
                ? t("dish.create")
                : t("dish.save")}
          </Button>
        </div>
      </footer>
    </aside>
  );
}
