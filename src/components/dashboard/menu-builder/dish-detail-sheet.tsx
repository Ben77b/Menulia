"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Camera, X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileBottomSheet } from "@/components/ui/mobile-bottom-sheet";
import { StickyActionBar } from "@/components/dashboard/sticky-action-bar";
import { useDashboardLocale } from "@/contexts/dashboard-locale-context";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { ToggleSwitch } from "@/components/dashboard/toggle-switch";
import type { MenuBuilderDish } from "@/lib/menu-builder-types";
import {
  FILTERABLE_TAG_OPTIONS,
  normalizeDishTagFields,
} from "@/lib/dietary-tags";
import { parsePriceInput } from "@/lib/price-input";
import {
  resolveBuilderSourceText,
  resolveBuilderTranslationText,
} from "@/lib/localized-text";
import {
  getMenuContentLanguageMeta,
  getSecondaryLanguage,
  type MenuContentLanguage,
} from "@/lib/menu-content-languages";
import { SecondaryLanguageField } from "./secondary-language-field";
import { AllergenPopoverField } from "./allergen-popover-field";
import { MAX_CATEGORY_NAME, MAX_DISH_DESCRIPTION, MAX_DISH_NAME, clampMenuText } from "@/lib/menu-limits";

export interface PriceVariationDraft {
  label: string;
  price: string;
}

export interface DishDetailDraft {
  name: string;
  nameTranslation: string;
  description: string;
  descriptionTranslation: string;
  price: string;
  usePriceVariations: boolean;
  priceVariations: PriceVariationDraft[];
  /** When enabled, this dish will be rendered without a price on the public menu */
  hide_price: boolean;
  /** When enabled, DeepL will not translate the dish title */
  lock_title_translation: boolean;
  image_url: string | null;
  filterableTags: string[];
  allergens: string[];
  is_available: boolean;
}

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
  const toast = useToast();
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [draft, setDraft] = useState<DishDetailDraft>({
    name: "",
    nameTranslation: "",
    description: "",
    descriptionTranslation: "",
    price: "",
    usePriceVariations: false,
    priceVariations: [{ label: "", price: "" }],
    hide_price: false,
    lock_title_translation: false,
    image_url: null,
    filterableTags: [],
    allergens: [],
    is_available: true,
  });
  const imageInputRef = useRef<HTMLInputElement>(null);

  const dishIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      dishIdRef.current = null;
      return;
    }
    if (!dish) return;
    if (dishIdRef.current === dish.id) return;

    dishIdRef.current = dish.id;
    const normalized = normalizeDishTagFields(dish.tags, dish.allergens);
    setDraft({
      name: resolveBuilderSourceText(dish.name, primaryLanguage),
      nameTranslation: resolveBuilderTranslationText(
        dish.name,
        getSecondaryLanguage(primaryLanguage)
      ),
      description: resolveBuilderSourceText(dish.description, primaryLanguage),
      descriptionTranslation: resolveBuilderTranslationText(
        dish.description,
        getSecondaryLanguage(primaryLanguage)
      ),
      price: String(dish.price),
      usePriceVariations: false,
      priceVariations: [{ label: "", price: String(dish.price) }],
      hide_price: Boolean(dish.hide_price),
      lock_title_translation: Boolean(dish.lock_title_translation),
      image_url: dish.image_url,
      filterableTags: normalized.tags,
      allergens: normalized.allergens,
      is_available: dish.is_available !== false,
    });
  }, [open, dish, primaryLanguage]);

  const primaryMeta = getMenuContentLanguageMeta(primaryLanguage);

  async function handleAvailabilityToggle(checked: boolean) {
    setDraft((prev) => ({ ...prev, is_available: checked }));
    if (!onAvailabilityChange) return;

    try {
      await onAvailabilityChange(checked);
    } catch {
      setDraft((prev) => ({ ...prev, is_available: !checked }));
      throw new Error("Failed to update dish visibility");
    }
  }

  function toggleFilterableTag(tag: string) {
    setDraft((prev) => ({
      ...prev,
      filterableTags: prev.filterableTags.includes(tag)
        ? prev.filterableTags.filter((t) => t !== tag)
        : [...prev.filterableTags, tag],
    }));
  }

  function toggleAllergen(tag: string) {
    setDraft((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(tag)
        ? prev.allergens.filter((t) => t !== tag)
        : [...prev.allergens, tag],
    }));
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await onImageUpload(file);
    if (url) setDraft((prev) => ({ ...prev, image_url: url }));
  }

  function addPriceVariation() {
    setDraft((prev) => ({
      ...prev,
      usePriceVariations: true,
      priceVariations: [
        ...prev.priceVariations,
        { label: "", price: "" },
      ],
    }));
  }

  function updatePriceVariation(index: number, patch: Partial<PriceVariationDraft>) {
    setDraft((prev) => ({
      ...prev,
      priceVariations: prev.priceVariations.map((row, i) =>
        i === index ? { ...row, ...patch } : row
      ),
    }));
  }

  function removePriceVariation(index: number) {
    setDraft((prev) => {
      const next = prev.priceVariations.filter((_, i) => i !== index);
      if (next.length === 0) {
        return {
          ...prev,
          usePriceVariations: false,
          price: prev.priceVariations[0]?.price ?? prev.price,
          priceVariations: [{ label: "", price: prev.price }],
        };
      }
      return { ...prev, priceVariations: next };
    });
  }

  function enablePriceVariations() {
    setDraft((prev) => ({
      ...prev,
      usePriceVariations: true,
      priceVariations: [
        { label: "Regular", price: prev.price },
        { label: "", price: "" },
      ],
    }));
  }

  async function handleGenerateDescription() {
    const dishName = draft.name.trim();
    if (!dishName) {
      toast.error("Enter a dish name first");
      return;
    }

    setGeneratingDescription(true);
    try {
      const response = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dishName,
          categoryName: categoryName.trim() || undefined,
          restaurantName: restaurantName.trim() || undefined,
        }),
      });

      const data = (await response.json()) as { description?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not generate description");
      }

      if (!data.description?.trim()) {
        throw new Error("No description was returned");
      }

      setDraft((prev) => ({
        ...prev,
        description: clampMenuText(data.description!, MAX_DISH_DESCRIPTION),
      }));
      toast.success("Description generated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not generate description");
    } finally {
      setGeneratingDescription(false);
    }
  }

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
          <ToggleSwitch
            label={t("dish.visibleOnMenu")}
            description={t("dish.visibleDescription")}
            checked={draft.is_available}
            onChange={handleAvailabilityToggle}
          />

          <div>
            <label className="air-label">{t("dish.photo")}</label>
            <div className="flex items-center gap-4">
              {draft.image_url ? (
                <div className="relative">
                  <img
                    src={draft.image_url}
                    alt={draft.name}
                    className="h-24 w-24 rounded-xl border border-gray-100 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, image_url: null }))}
                    className="absolute -right-2 -top-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-red-500 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted">
                  <Camera className="h-7 w-7 text-gray-400" />
                </div>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={uploadingImage}
                onClick={() => imageInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {uploadingImage ? t("dish.uploading") : t("dish.upload")}
              </Button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label className="air-label mb-0">Name ({primaryMeta.label})</label>
              <SecondaryLanguageField
                primaryLanguage={primaryLanguage}
                label="name"
                maxLength={MAX_DISH_NAME}
                value={draft.nameTranslation}
                onChange={(value) => setDraft((prev) => ({ ...prev, nameTranslation: value }))}
                onSave={async () => undefined}
              />
            </div>
            <input
              value={draft.name}
              maxLength={MAX_DISH_NAME}
              onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
              className="air-input"
            />
          </div>

          <div>
            {!draft.usePriceVariations ? (
              <>
                <label className="air-label">{t("dish.price")}</label>
                <CurrencyInput
                  value={draft.price}
                  onChange={(e) => setDraft((p) => ({ ...p, price: e.target.value }))}
                  onBlur={() =>
                    setDraft((p) => {
                      if (!p.price.trim()) return p;
                      return { ...p, price: parsePriceInput(p.price).toFixed(2) };
                    })
                  }
                  placeholder="12.50"
                  wrapperClassName="mt-1.5"
                />
                <button
                  type="button"
                  onClick={enablePriceVariations}
                  className="mt-2 inline-flex min-h-11 items-center text-xs font-medium text-slate-600 transition-colors hover:text-slate-900"
                >
                  {t("dish.addPriceVariations")}
                </button>
              </>
            ) : (
              <div className="space-y-3 rounded-xl border border-[#E5E5EA] bg-[#FAFAFA]/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <label className="air-label mb-0">{t("dish.priceVariations")}</label>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        usePriceVariations: false,
                        price:
                          prev.priceVariations.find((row) => row.price.trim())?.price ?? prev.price,
                        priceVariations: [{ label: "", price: prev.price }],
                      }))
                    }
                    className="text-xs text-[#86868B] transition-colors hover:text-slate-700"
                  >
                    {t("dish.useSinglePrice")}
                  </button>
                </div>
                <div className="space-y-2">
                  {draft.priceVariations.map((row, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        value={row.label}
                        onChange={(e) => updatePriceVariation(index, { label: e.target.value })}
                        placeholder="Size or portion"
                        className="air-input min-w-0 flex-1"
                      />
                      <CurrencyInput
                        value={row.price}
                        onChange={(e) => updatePriceVariation(index, { price: e.target.value })}
                        onBlur={() =>
                          updatePriceVariation(index, {
                            price: row.price.trim()
                              ? parsePriceInput(row.price).toFixed(2)
                              : row.price,
                          })
                        }
                        placeholder="0.00"
                        wrapperClassName="w-28 shrink-0"
                      />
                      {draft.priceVariations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePriceVariation(index)}
                          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[#C7C7CC] hover:text-red-500"
                          aria-label="Remove price variation"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addPriceVariation}
                  className="inline-flex min-h-11 items-center text-xs font-medium text-slate-600 transition-colors hover:text-slate-900"
                >
                  {t("dish.addAnotherVariation")}
                </button>
              </div>
            )}
          </div>

          <ToggleSwitch
            label={t("dish.hidePrice")}
            description={t("dish.hidePriceDescription")}
            checked={draft.hide_price}
            onChange={(checked) => setDraft((prev) => ({ ...prev, hide_price: checked }))}
          />

          <ToggleSwitch
            label={t("dish.lockTitle")}
            description={t("dish.lockTitleDescription")}
            checked={draft.lock_title_translation}
            onChange={(checked) =>
              setDraft((prev) => ({ ...prev, lock_title_translation: checked }))
            }
          />

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label className="air-label mb-0">{t("dish.description")} ({primaryMeta.label})</label>
              <div className="flex items-center gap-1">
                <SecondaryLanguageField
                  primaryLanguage={primaryLanguage}
                  label="description"
                  value={draft.descriptionTranslation}
                  multiline
                  maxLength={MAX_DISH_DESCRIPTION}
                  onChange={(value) =>
                    setDraft((prev) => ({ ...prev, descriptionTranslation: value }))
                  }
                  onSave={async () => undefined}
                />
                <button
                  type="button"
                  onClick={() => void handleGenerateDescription()}
                  disabled={generatingDescription || saving}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-[#F5F5F7] hover:text-slate-900 disabled:opacity-50"
                  aria-label="Generate description with AI"
                >
                  {generatingDescription ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  <span>{generatingDescription ? t("dish.aiWriting") : t("dish.aiWrite")}</span>
                </button>
              </div>
            </div>
            <div className="relative">
              <textarea
                rows={4}
                value={draft.description}
                maxLength={MAX_DISH_DESCRIPTION}
                onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                disabled={generatingDescription}
                placeholder={
                  generatingDescription ? "Generating description…" : "Short sensory description for guests and search"
                }
                className={cn(
                  "air-input min-h-[100px] resize-none py-2",
                  generatingDescription && "text-[#86868B]"
                )}
              />
              {generatingDescription && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-[10px] bg-white/60">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="air-label">{t("dish.filterableTags")}</label>
            <p className="air-helper mb-3">{t("dish.filterableTagsHelp")}</p>
            <div className="flex flex-wrap gap-2">
              {FILTERABLE_TAG_OPTIONS.map(({ tag }) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleFilterableTag(tag)}
                  className={cn(
                    "min-h-11 rounded-full border px-4 py-2 text-xs font-medium",
                    draft.filterableTags.includes(tag)
                      ? "border-slate-300 bg-[#F5F5F7] text-slate-900"
                      : "border-[#E5E5EA] text-[#86868B]"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <AllergenPopoverField
            selected={draft.allergens}
            onToggle={toggleAllergen}
            disabled={Boolean(saving)}
          />
    </MobileBottomSheet>
  );
}
