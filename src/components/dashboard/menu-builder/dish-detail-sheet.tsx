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
  primaryLanguage: MenuContentLanguage;
  saving?: boolean;
  uploadingImage?: boolean;
  onClose: () => void;
  onSave: (draft: DishDetailDraft) => Promise<void>;
  onImageUpload: (file: File) => Promise<string | null>;
  onAvailabilityChange?: (isAvailable: boolean) => Promise<void>;
  restaurantName?: string;
  categoryName?: string;
}

export function DishDetailSheet({
  open,
  dish,
  primaryLanguage,
  saving,
  uploadingImage,
  onClose,
  onSave,
  onImageUpload,
  onAvailabilityChange,
  restaurantName = "",
  categoryName = "",
}: DishDetailSheetProps) {
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
  } = useDishDetailDraft(dish, primaryLanguage, open);

  return (
    <MobileBottomSheet
      open={open}
      onClose={onClose}
      title={t("dish.editTitle")}
      footer={
        <StickyActionBar>
          <Button variant="outline" onClick={onClose} className="min-h-11">
            {t("dish.cancel")}
          </Button>
          <Button
            variant="dark"
            disabled={saving || !draft.name.trim()}
            onClick={() => onSave(draft)}
            className="min-h-11"
          >
            {saving ? t("dish.saving") : t("dish.save")}
          </Button>
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
        enablePriceVariations={enablePriceVariations}
        toggleFilterableTag={toggleFilterableTag}
        toggleAllergen={toggleAllergen}
      />
    </MobileBottomSheet>
  );
}
