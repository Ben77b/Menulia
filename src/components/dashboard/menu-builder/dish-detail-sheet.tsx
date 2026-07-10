"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Camera, X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StickyActionBar } from "@/components/dashboard/sticky-action-bar";
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

      setDraft((prev) => ({ ...prev, description: data.description!.trim() }));
      toast.success("Description generated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not generate description");
    } finally {
      setGeneratingDescription(false);
    }
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[#E5E5EA] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.08)] transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-[#F5F5F7] px-5 py-4">
          <h2 className="air-section-title text-lg">Edit Dish</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <ToggleSwitch
            label="Visible on Menu"
            description="Turn off to hide this dish from your public menu when it is out of stock."
            checked={draft.is_available}
            onChange={handleAvailabilityToggle}
          />

          <div>
            <label className="air-label">Photo</label>
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
                    className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
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
                {uploadingImage ? "Uploading…" : "Upload"}
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
                value={draft.nameTranslation}
                onChange={(value) => setDraft((prev) => ({ ...prev, nameTranslation: value }))}
                onSave={async () => undefined}
              />
            </div>
            <input
              value={draft.name}
              onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
              className="air-input"
            />
          </div>

          <div>
            {!draft.usePriceVariations ? (
              <>
                <label className="air-label">Price</label>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#86868B]">
                    €
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={draft.price}
                    onChange={(e) => setDraft((p) => ({ ...p, price: e.target.value }))}
                    onBlur={() =>
                      setDraft((p) => {
                        if (!p.price.trim()) return p;
                        return { ...p, price: parsePriceInput(p.price).toFixed(2) };
                      })
                    }
                    placeholder="12.50"
                    className="air-input pl-8"
                  />
                </div>
                <button
                  type="button"
                  onClick={enablePriceVariations}
                  className="mt-2 text-xs font-medium text-slate-600 transition-colors hover:text-slate-900"
                >
                  + Añadir variaciones de precio (tamaños, raciones...) / Add price variations
                </button>
              </>
            ) : (
              <div className="space-y-3 rounded-xl border border-[#E5E5EA] bg-[#FAFAFA]/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <label className="air-label mb-0">Price variations</label>
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
                    Use single price
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
                      <div className="relative w-28 shrink-0">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#86868B]">
                          €
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
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
                          className="air-input pl-8"
                        />
                      </div>
                      {draft.priceVariations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePriceVariation(index)}
                          className="rounded-lg p-1 text-[#C7C7CC] hover:text-red-500"
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
                  className="text-xs font-medium text-slate-600 transition-colors hover:text-slate-900"
                >
                  + Add another variation
                </button>
              </div>
            )}
          </div>

          <ToggleSwitch
            label="Hide price on public menu"
            description="Show the dish name and description, but omit its price."
            checked={draft.hide_price}
            onChange={(checked) => setDraft((prev) => ({ ...prev, hide_price: checked }))}
          />

          <ToggleSwitch
            label="Do not translate title"
            description="Protects unique dish names from changing. Description will still be translated."
            checked={draft.lock_title_translation}
            onChange={(checked) =>
              setDraft((prev) => ({ ...prev, lock_title_translation: checked }))
            }
          />

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label className="air-label mb-0">Description ({primaryMeta.label})</label>
              <div className="flex items-center gap-1">
                <SecondaryLanguageField
                  primaryLanguage={primaryLanguage}
                  label="description"
                  value={draft.descriptionTranslation}
                  multiline
                  onChange={(value) =>
                    setDraft((prev) => ({ ...prev, descriptionTranslation: value }))
                  }
                  onSave={async () => undefined}
                />
                <button
                  type="button"
                  onClick={() => void handleGenerateDescription()}
                  disabled={generatingDescription || saving}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-[#F5F5F7] hover:text-slate-900 disabled:opacity-50"
                  aria-label="Generate description with AI"
                >
                  {generatingDescription ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  <span>{generatingDescription ? "Writing…" : "AI write"}</span>
                </button>
              </div>
            </div>
            <div className="relative">
              <textarea
                rows={4}
                value={draft.description}
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
            <label className="air-label">Filterable tags</label>
            <p className="air-helper mb-3">
              Guests can filter the menu by these four options.
            </p>
            <div className="flex flex-wrap gap-2">
              {FILTERABLE_TAG_OPTIONS.map(({ tag }) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleFilterableTag(tag)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium",
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
        </div>

        <StickyActionBar>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="dark"
            disabled={saving || !draft.name.trim()}
            onClick={() => onSave(draft)}
          >
            {saving ? "Saving…" : "Save Dish"}
          </Button>
        </StickyActionBar>
      </aside>
    </>
  );
}
