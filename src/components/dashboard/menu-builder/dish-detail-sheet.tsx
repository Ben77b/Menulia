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
    toggleFilterableTag,
    toggleAllergen,
  } = useDishDetailDraft(dish, primaryLanguage, open);

  return (
    <MobileBottomSheet
      open={open}
      onClose={onClose}
      title={isCreate ? t("dish.addTitle") : t("dish.editTitle")}
      footer={
        <StickyActionBar className="[&>div]:w-full [&>div]:flex-col [&>div]:items-stretch [&>div]:gap-2">
          {!isCreate && onDelete ? (
            <Button
              variant="outline"
              onClick={onDelete}
              disabled={saving}
              className="min-h-11 w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              {t("dish.delete")}
            </Button>
          ) : null}
          <div className="flex w-full gap-2">
            <Button variant="outline" onClick={onClose} className="min-h-11 flex-1">
              {t("dish.cancel")}
            </Button>
            <Button
              variant="dark"
              disabled={saving || !draft.name.trim()}
              onClick={() => onSave(draft)}
              className="min-h-11 flex-1"
            >
              {saving ? (isCreate ? t("dish.creating") : t("dish.saving")) : isCreate ? t("dish.create") : t("dish.save")}
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
        toggleFilterableTag={toggleFilterableTag}
        toggleAllergen={toggleAllergen}
      />
    </MobileBottomSheet>
  );
}
