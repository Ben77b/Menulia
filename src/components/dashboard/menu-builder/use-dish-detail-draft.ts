"use client";

import { useEffect, useRef, useState } from "react";
import type { MenuBuilderDish } from "@/lib/menu-builder-types";
import { normalizeDishTagFields } from "@/lib/dietary-tags";
import {
  resolveBuilderSourceText,
  resolveBuilderTranslationText,
} from "@/lib/localized-text";
import {
  getSecondaryLanguage,
  type MenuContentLanguage,
} from "@/lib/menu-content-languages";
import { hasPriceVariations, type PriceVariation } from "@/lib/price-variations";
import { parsePriceInput } from "@/lib/price-input";
import type { DishDetailDraft, PriceVariationDraft } from "./dish-detail-types";

export const EMPTY_DISH_DRAFT: DishDetailDraft = {
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
};

export function dishToDraft(
  dish: MenuBuilderDish,
  primaryLanguage: MenuContentLanguage
): DishDetailDraft {
  const normalized = normalizeDishTagFields(dish.tags, dish.allergens);
  const usePriceVariations = hasPriceVariations(dish.price_variations);

  return {
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
    usePriceVariations,
    priceVariations: usePriceVariations
      ? dish.price_variations.map((variation) => ({
          label: variation.label,
          price: variation.price.toFixed(2),
        }))
      : [{ label: "", price: String(dish.price) }],
    hide_price: Boolean(dish.hide_price),
    lock_title_translation: Boolean(dish.lock_title_translation),
    image_url: dish.image_url,
    filterableTags: normalized.tags,
    allergens: normalized.allergens,
    is_available: dish.is_available !== false,
  };
}

export function useDishDetailDraft(
  dish: MenuBuilderDish | null,
  primaryLanguage: MenuContentLanguage,
  active: boolean
) {
  const [draft, setDraft] = useState<DishDetailDraft>(EMPTY_DISH_DRAFT);
  const dishIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!active) {
      dishIdRef.current = null;
      return;
    }
    if (!dish) {
      if (dishIdRef.current !== "__new__") {
        dishIdRef.current = "__new__";
        setDraft(EMPTY_DISH_DRAFT);
      }
      return;
    }
    if (dishIdRef.current === dish.id) return;

    dishIdRef.current = dish.id;
    setDraft(dishToDraft(dish, primaryLanguage));
  }, [active, dish, primaryLanguage]);

  function addPriceVariation() {
    setDraft((prev) => ({
      ...prev,
      usePriceVariations: true,
      priceVariations: [...prev.priceVariations, { label: "", price: "" }],
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

  function setUsePriceVariations(enabled: boolean) {
    setDraft((prev) => {
      if (enabled) {
        const seeded =
          prev.priceVariations.some((row) => row.label.trim() || row.price.trim()) &&
          prev.usePriceVariations
            ? prev.priceVariations
            : [
                { label: "", price: prev.price || "" },
                { label: "", price: "" },
              ];
        return {
          ...prev,
          usePriceVariations: true,
          priceVariations: seeded,
        };
      }

      const fallbackPrice =
        prev.priceVariations.find((row) => row.price.trim())?.price ?? prev.price;

      return {
        ...prev,
        usePriceVariations: false,
        price: fallbackPrice,
        priceVariations: [{ label: "", price: fallbackPrice }],
      };
    });
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

  return {
    draft,
    setDraft,
    addPriceVariation,
    updatePriceVariation,
    removePriceVariation,
    setUsePriceVariations,
    toggleFilterableTag,
    toggleAllergen,
  };
}

export function draftToStoredPriceVariations(draft: DishDetailDraft): PriceVariation[] | null {
  if (!draft.usePriceVariations) return null;

  const variations = draft.priceVariations
    .map((row) => ({
      label: row.label.trim(),
      price: row.price.trim() ? parsePriceInput(row.price) : Number.NaN,
    }))
    .filter((row) => row.label.length > 0 && !Number.isNaN(row.price));

  return variations.length > 0 ? variations : null;
}
