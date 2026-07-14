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
  dish: MenuBuilderDish;
  primaryLanguage: MenuContentLanguage;
  saving?: boolean;
  uploadingImage?: boolean;
  restaurantName?: string;
  categoryName?: string;
  onClose: () => void;
  onSave: (draft: DishDetailDraft) => Promise<void>;
  onImageUpload: (file: File) => Promise<string | null>;
  onAvailabilityChange?: (isAvailable: boolean) => Promise<void>;
  className?: string;
}

export function DishDetailInspector({
  dish,
  primaryLanguage,
  saving,
  uploadingImage,
  restaurantName,
  categoryName,
  onClose,
  onSave,
  onImageUpload,
  onAvailabilityChange,
  className,
}: DishDetailInspectorProps) {
  const { t } = useDashboardLocale();
  const {
    draft,
    setDraft,
    addPriceVariation,
    updatePriceVariation,
    removePriceVariation,
    enablePriceVariations,
    toggleFilterableTag,
    toggleAllergen,
  } = useDishDetailDraft(dish, primaryLanguage, true);

  const dishName = resolveBuilderSourceText(dish.name, primaryLanguage) || "Untitled dish";

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
            {t("dish.editTitle")}
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

      <div className="min-h-0 flex-1 overflow-y-auto bg-neutral-50/30 px-5 py-5">
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
          enablePriceVariations={enablePriceVariations}
          toggleFilterableTag={toggleFilterableTag}
          toggleAllergen={toggleAllergen}
        />
      </div>

      <footer className="shrink-0 border-t border-neutral-200/60 bg-white px-5 py-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="min-h-11 flex-1">
            {t("dish.cancel")}
          </Button>
          <Button
            variant="dark"
            disabled={saving || !draft.name.trim()}
            onClick={() => onSave(draft)}
            className="min-h-11 flex-1"
          >
            {saving ? t("dish.saving") : t("dish.save")}
          </Button>
        </div>
      </footer>
    </aside>
  );
}
