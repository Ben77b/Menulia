"use client";

import { Button } from "@/components/ui/button";
import { MobileBottomSheet } from "@/components/ui/mobile-bottom-sheet";
import { StickyActionBar } from "@/components/dashboard/sticky-action-bar";
import { useDashboardLocale } from "@/contexts/dashboard-locale-context";
import type { MenuBuilderDish } from "@/lib/menu-builder-types";
import type { MenuContentLanguage } from "@/lib/menu-content-languages";
import { DishDetailForm } from "./dish-detail-form";
import { useDishDetailDraft } from "./use-dish-detail-draft";
import type { DishDetailDraft } from "./dish-detail-types";

export type { DishDetailDraft, PriceVariationDraft } from "./dish-detail-types";

interface DishDetailSheetProps {
  open: boolean;
  dish: MenuBuilderDish | null;
  mode?: "create" | "edit";
  primaryLanguage: MenuContentLanguage;
  saving?: boolean;
  uploadingImage?: boolean;
  onClose: () => void;
  onSave: (draft: DishDetailDraft) => Promise<void>;
  onDelete?: () => void;
  onImageUpload: (file: File) => Promise<string | null>;
  onAvailabilityChange?: (isAvailable: boolean) => Promise<void>;
  restaurantName?: string;
  categoryName?: string;
  menuTagSuggestions?: readonly { tag: string; label?: string; icon?: string }[];
  tagLibraryTotal?: number;
  tagLibraryAtLimit?: boolean;
  onDeleteMenuTag?: (label: string) => void | Promise<void>;
}

export function DishDetailSheet({
  open,
  dish,
  mode = dish ? "edit" : "create",
  primaryLanguage,
  saving,
  uploadingImage,
  onClose,
  onSave,
  onDelete,
  onImageUpload,
  onAvailabilityChange,
  restaurantName = "",
  categoryName = "",
  menuTagSuggestions = [],
  tagLibraryTotal = 0,
  tagLibraryAtLimit = false,
  onDeleteMenuTag,
}: DishDetailSheetProps) {
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
  } = useDishDetailDraft(dish, primaryLanguage, open);

  return (
    <MobileBottomSheet
      open={open}
      onClose={onClose}
      title={isCreate ? t("dish.addTitle") : t("dish.editTitle")}
      footer={
        <StickyActionBar className="[&>div]:w-full [&>div]:items-center [&>div]:justify-between [&>div]:gap-3">
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
            ) : (
              <span aria-hidden />
            )}
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
              className="min-h-11 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-zinc-800 focus-visible:ring-offset-0"
            >
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white"
                    aria-hidden
                  />
                  {isCreate ? t("dish.creating") : t("dish.saving")}
                </span>
              ) : isCreate ? (
                t("dish.create")
              ) : (
                t("dish.save")
              )}
            </Button>
          </div>
        </StickyActionBar>
      }
    >
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
        tagLibraryTotal={tagLibraryTotal}
        tagLibraryAtLimit={tagLibraryAtLimit}
        onDeleteMenuTag={onDeleteMenuTag}
      />
    </MobileBottomSheet>
  );
}
