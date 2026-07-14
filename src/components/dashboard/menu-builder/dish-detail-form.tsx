"use client";

import { useRef, useState } from "react";
import { Upload, Camera, X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useDashboardLocale } from "@/contexts/dashboard-locale-context";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { ToggleSwitch } from "@/components/dashboard/toggle-switch";
import {
  FILTERABLE_TAG_OPTIONS,
} from "@/lib/dietary-tags";
import { parsePriceInput } from "@/lib/price-input";
import {
  getMenuContentLanguageMeta,
  type MenuContentLanguage,
} from "@/lib/menu-content-languages";
import { SecondaryLanguageField } from "./secondary-language-field";
import { AllergenPopoverField } from "./allergen-popover-field";
import { MAX_DISH_DESCRIPTION, MAX_DISH_NAME, clampMenuText } from "@/lib/menu-limits";
import type { DishDetailDraft, PriceVariationDraft } from "./dish-detail-types";

const inputClass =
  "w-full rounded-xl border border-neutral-200/60 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition-all duration-200 ease-in-out focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-800/60 dark:bg-neutral-950 dark:text-neutral-100";

const labelClass =
  "mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400";

interface DishDetailFormProps {
  draft: DishDetailDraft;
  setDraft: React.Dispatch<React.SetStateAction<DishDetailDraft>>;
  primaryLanguage: MenuContentLanguage;
  saving?: boolean;
  uploadingImage?: boolean;
  onImageUpload: (file: File) => Promise<string | null>;
  onAvailabilityChange?: (isAvailable: boolean) => Promise<void>;
  restaurantName?: string;
  categoryName?: string;
  addPriceVariation: () => void;
  updatePriceVariation: (index: number, patch: Partial<PriceVariationDraft>) => void;
  removePriceVariation: (index: number) => void;
  enablePriceVariations: () => void;
  toggleFilterableTag: (tag: string) => void;
  toggleAllergen: (tag: string) => void;
}

export function DishDetailForm({
  draft,
  setDraft,
  primaryLanguage,
  saving,
  uploadingImage,
  onImageUpload,
  onAvailabilityChange,
  restaurantName = "",
  categoryName = "",
  addPriceVariation,
  updatePriceVariation,
  removePriceVariation,
  enablePriceVariations,
  toggleFilterableTag,
  toggleAllergen,
}: DishDetailFormProps) {
  const { t } = useDashboardLocale();
  const toast = useToast();
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
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

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await onImageUpload(file);
    if (url) setDraft((prev) => ({ ...prev, image_url: url }));
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
    <div className="space-y-5">
      <ToggleSwitch
        label={t("dish.visibleOnMenu")}
        description={t("dish.visibleDescription")}
        checked={draft.is_available}
        onChange={handleAvailabilityToggle}
      />

      <div>
        <label className={labelClass}>{t("dish.photo")}</label>
        <div className="flex items-center gap-4">
          {draft.image_url ? (
            <div className="relative">
              <img
                src={draft.image_url}
                alt={draft.name}
                className="h-24 w-24 rounded-xl border border-neutral-200/60 object-cover"
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
            <div className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-neutral-200/60 bg-neutral-50 dark:border-neutral-800/60 dark:bg-neutral-900">
              <Camera className="h-7 w-7 text-neutral-400" />
            </div>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={uploadingImage}
            onClick={() => imageInputRef.current?.click()}
            className="min-h-11 gap-2"
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
          <label className={cn(labelClass, "mb-0")}>Name ({primaryMeta.label})</label>
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
          className={inputClass}
        />
      </div>

      <div>
        {!draft.usePriceVariations ? (
          <>
            <label className={labelClass}>{t("dish.price")}</label>
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
              className="mt-2 inline-flex min-h-11 items-center text-xs font-medium text-neutral-600 transition-all duration-200 ease-in-out hover:text-neutral-900"
            >
              {t("dish.addPriceVariations")}
            </button>
          </>
        ) : (
          <div className="space-y-3 rounded-xl border border-neutral-200/60 bg-neutral-50/60 p-4 dark:border-neutral-800/60 dark:bg-neutral-900/40">
            <div className="flex items-center justify-between gap-2">
              <label className={cn(labelClass, "mb-0")}>{t("dish.priceVariations")}</label>
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
                className="text-xs text-neutral-500 transition-all duration-200 ease-in-out hover:text-neutral-700"
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
                    className={cn(inputClass, "min-w-0 flex-1")}
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
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-neutral-300 hover:text-red-500"
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
              className="inline-flex min-h-11 items-center text-xs font-medium text-neutral-600 transition-all duration-200 ease-in-out hover:text-neutral-900"
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
          <label className={cn(labelClass, "mb-0")}>
            {t("dish.description")} ({primaryMeta.label})
          </label>
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
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-600 transition-all duration-200 ease-in-out hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-50"
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
              generatingDescription
                ? "Generating description…"
                : "Short sensory description for guests and search"
            }
            className={cn(
              inputClass,
              "min-h-[100px] resize-none py-2",
              generatingDescription && "text-neutral-500"
            )}
          />
          {generatingDescription && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-white/60">
              <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
            </div>
          )}
        </div>
      </div>

      <div>
        <label className={labelClass}>{t("dish.filterableTags")}</label>
        <p className="mb-3 text-xs text-neutral-500">{t("dish.filterableTagsHelp")}</p>
        <div className="flex flex-wrap gap-2">
          {FILTERABLE_TAG_OPTIONS.map(({ tag }) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleFilterableTag(tag)}
              className={cn(
                "min-h-11 rounded-full border px-4 py-2 text-xs font-medium transition-all duration-200 ease-in-out",
                draft.filterableTags.includes(tag)
                  ? "border-neutral-300 bg-neutral-100 text-neutral-900"
                  : "border-neutral-200/60 text-neutral-500"
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
    </div>
  );
}
