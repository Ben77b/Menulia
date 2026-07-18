"use client";

import { useState, type FocusEvent, type ReactNode } from "react";
import { Sparkles, Loader2, Trash2, Plus } from "lucide-react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useDashboardLocale } from "@/contexts/dashboard-locale-context";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { ToggleSwitch } from "@/components/dashboard/toggle-switch";
import { parsePriceInput } from "@/lib/price-input";
import {
  getMenuContentLanguageMeta,
  type MenuContentLanguage,
} from "@/lib/menu-content-languages";
import { AllergenPopoverField } from "./allergen-popover-field";
import { CreatableTagInput } from "./creatable-tag-input";
import { DishImageUploader } from "./dish-image-uploader";
import { MAX_DISH_DESCRIPTION, MAX_DISH_NAME, clampMenuText } from "@/lib/menu-limits";
import type { DishDetailDraft, PriceVariationDraft } from "./dish-detail-types";

const inputClass =
  "w-full rounded-xl border border-neutral-200/80 bg-white px-3 py-2.5 text-sm text-neutral-800 shadow-sm placeholder:text-neutral-400 transition-all duration-200 ease-in-out focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/5";

const labelClass =
  "mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-500";

const sectionTitleClass =
  "text-xs font-semibold uppercase tracking-wider text-neutral-500";

function scrollFocusedFieldIntoView(event: FocusEvent<HTMLElement>) {
  window.requestAnimationFrame(() => {
    event.currentTarget.scrollIntoView({ block: "center", behavior: "smooth" });
  });
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col space-y-4 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm sm:p-5">
      <h3 className={sectionTitleClass}>{title}</h3>
      <div className="flex flex-col space-y-4">{children}</div>
    </section>
  );
}

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
  setUsePriceVariations: (enabled: boolean) => void;
  setFilterableTags: (tags: string[]) => void;
  toggleAllergen: (tag: string) => void;
  menuTagSuggestions?: readonly { tag: string; label?: string; icon?: string }[];
  tagLibraryTotal?: number;
  tagLibraryAtLimit?: boolean;
  onDeleteMenuTag?: (label: string) => void | Promise<void>;
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
  setUsePriceVariations,
  setFilterableTags,
  toggleAllergen,
  menuTagSuggestions = [],
  tagLibraryTotal = 0,
  tagLibraryAtLimit = false,
  onDeleteMenuTag,
}: DishDetailFormProps) {
  const { t } = useDashboardLocale();
  const toast = useToast();
  const [generatingDescription, setGeneratingDescription] = useState(false);
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
    <div className="flex flex-col space-y-5">
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm">
        <ToggleSwitch
          label={t("dish.visibleOnMenu")}
          description={t("dish.visibleDescription")}
          checked={draft.is_available}
          onChange={handleAvailabilityToggle}
        />
      </div>

      <FormSection title={t("dish.section.identity")}>
        <div>
          <label className={labelClass}>{t("dish.photo")}</label>
          <DishImageUploader
            imageUrl={draft.image_url}
            onImageUrlChange={(url) => setDraft((prev) => ({ ...prev, image_url: url }))}
            onImageUpload={onImageUpload}
            uploading={uploadingImage}
          />
        </div>

        <div>
          <label className={labelClass}>
            Name ({primaryMeta.label.toUpperCase()})
          </label>
          <input
            value={draft.name}
            maxLength={MAX_DISH_NAME}
            onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
            onFocus={scrollFocusedFieldIntoView}
            placeholder="Dish name"
            className={inputClass}
          />
          <button
            type="button"
            role="switch"
            aria-checked={draft.lock_title_translation}
            onClick={() =>
              setDraft((prev) => ({
                ...prev,
                lock_title_translation: !prev.lock_title_translation,
              }))
            }
            className="mt-3 flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-neutral-50/50 p-3 text-left dark:border-neutral-800 dark:bg-neutral-900/50"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  {t("dish.lockTitle")}
                </p>
                <span className="inline-flex max-w-full rounded-md border border-amber-200/80 bg-amber-50 px-2 py-0.5 text-[11px] font-medium leading-snug text-amber-900">
                  {t("dish.lockTitleBadge")}
                </span>
              </div>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                {t("dish.lockTitleDescription")}
              </p>
            </div>
            <span
              className={cn(
                "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors",
                draft.lock_title_translation
                  ? "border-zinc-900 bg-zinc-900"
                  : "border-neutral-300 bg-neutral-200/80 dark:border-neutral-600 dark:bg-neutral-700"
              )}
              aria-hidden
            >
              <span
                className={cn(
                  "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                  draft.lock_title_translation ? "translate-x-6" : "translate-x-1"
                )}
              />
            </span>
          </button>
        </div>

        <div>
          <div className="mb-1.5 flex flex-col gap-2">
            <label className={cn(labelClass, "mb-0")}>
              {t("dish.description")} ({primaryMeta.label.toUpperCase()})
            </label>
            <button
              type="button"
              onClick={() => void handleGenerateDescription()}
              disabled={generatingDescription || saving}
              className="inline-flex min-h-10 w-fit items-center gap-1.5 rounded-lg border border-neutral-200/80 bg-white px-3 py-2 text-xs font-medium text-neutral-600 shadow-sm transition-all duration-200 ease-in-out hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-50"
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
          <div className="relative">
            <textarea
              rows={4}
              value={draft.description}
              maxLength={MAX_DISH_DESCRIPTION}
              onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
              onFocus={scrollFocusedFieldIntoView}
              disabled={generatingDescription}
              placeholder={
                generatingDescription
                  ? "Generating description…"
                  : "Short sensory description for guests"
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
      </FormSection>

      <FormSection title={t("dish.section.pricing")}>
        <ToggleSwitch
          label={t("dish.hasPortions")}
          description={t("dish.hasPortionsDescription")}
          checked={draft.usePriceVariations}
          onChange={setUsePriceVariations}
        />

        {!draft.usePriceVariations ? (
          <div>
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
              className="placeholder:text-neutral-400"
              wrapperClassName="mt-1.5 shadow-sm"
            />
          </div>
        ) : (
          <div className="flex flex-col space-y-3">
            <label className={cn(labelClass, "mb-0")}>{t("dish.portionsAndPrices")}</label>
            <div className="flex flex-col space-y-2">
              {draft.priceVariations.map((row, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-2 rounded-xl border border-neutral-200/70 bg-neutral-50/50 p-3 shadow-sm"
                >
                  <input
                    value={row.label}
                    onChange={(e) => updatePriceVariation(index, { label: e.target.value })}
                    onFocus={scrollFocusedFieldIntoView}
                    placeholder={t("dish.portionNamePlaceholder")}
                    className={inputClass}
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
                    className="placeholder:text-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() => removePriceVariation(index)}
                    disabled={draft.priceVariations.length <= 1}
                    className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-xl border border-neutral-200/60 bg-white px-3 text-sm text-neutral-500 shadow-sm transition-all duration-200 ease-in-out hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                    aria-label={t("dish.removePortion")}
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("dish.removePortion")}
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addPriceVariation}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-dashed border-neutral-200/80 px-3 text-sm font-medium text-neutral-600 shadow-sm transition-all duration-200 ease-in-out hover:border-sky-200 hover:bg-sky-50/60 hover:text-sky-700"
            >
              <Plus className="h-4 w-4" />
              {t("dish.addSizeOption")}
            </button>
          </div>
        )}
      </FormSection>

      <FormSection title={t("dish.section.dietary")}>
        <div>
          <label className={labelClass}>{t("dish.filterableTags")}</label>
          <p className="mb-3 text-xs text-neutral-500">{t("dish.filterableTagsHelp")}</p>
          <CreatableTagInput
            value={draft.filterableTags}
            onChange={setFilterableTags}
            disabled={Boolean(saving)}
            placeholder={t("dish.tagsPlaceholder")}
            menuSuggestions={menuTagSuggestions}
            tagLibraryTotal={tagLibraryTotal}
            tagLibraryAtLimit={tagLibraryAtLimit}
            onDeleteMenuTag={onDeleteMenuTag}
          />
        </div>

        <AllergenPopoverField
          selected={draft.allergens}
          onToggle={toggleAllergen}
          disabled={Boolean(saving)}
        />
      </FormSection>
    </div>
  );
}
