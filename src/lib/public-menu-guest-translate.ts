import {
  parseLocalizedFieldFromDb,
  resolveLocalizedText,
  type LocalizedTextValue,
} from "@/lib/localized-text";
import type { PublicMenuParentCategory, PublicMenuSubcategory } from "@/lib/menu-hierarchy";
import type { PublicMenuDish } from "@/components/public/dish-card";
import type { MenuContentLanguage } from "@/lib/menu-content-languages";
import { localizeHoursDisplay } from "@/lib/public-menu-metadata-i18n";

export type PublicMenuTranslatePatch = {
  id: string;
  name?: LocalizedTextValue;
  description?: LocalizedTextValue;
};

export type PublicMenuRestaurantTranslatePatch = {
  footer_slogan?: LocalizedTextValue | null;
  meta_description?: LocalizedTextValue | null;
  hours?: LocalizedTextValue | null;
};

function patchDish(dish: PublicMenuDish, patch: PublicMenuTranslatePatch | undefined): PublicMenuDish {
  if (!patch) return dish;
  return {
    ...dish,
    name: patch.name ?? dish.name,
    description: patch.description ?? dish.description,
  };
}

function patchSubcategory(
  subcategory: PublicMenuSubcategory,
  categoryPatches: Map<string, PublicMenuTranslatePatch>,
  dishPatches: Map<string, PublicMenuTranslatePatch>
): PublicMenuSubcategory {
  const categoryPatch = categoryPatches.get(subcategory.id);
  return {
    ...subcategory,
    name: categoryPatch?.name ?? subcategory.name,
    description: categoryPatch?.description ?? subcategory.description,
    dishes: (subcategory.dishes ?? []).map((dish) => patchDish(dish, dishPatches.get(dish.id))),
  };
}

export function applyPublicMenuTranslatePatches(
  menu: PublicMenuParentCategory[],
  flatCategories: PublicMenuSubcategory[],
  categoryList: PublicMenuTranslatePatch[],
  dishList: PublicMenuTranslatePatch[]
): { menu: PublicMenuParentCategory[]; flatCategories: PublicMenuSubcategory[] } {
  const categoryPatches = new Map(categoryList.map((patch) => [patch.id, patch]));
  const dishPatches = new Map(dishList.map((patch) => [patch.id, patch]));

  return {
    menu: menu.map((parent) => {
      const parentPatch = categoryPatches.get(parent.id);
      return {
        ...parent,
        name: parentPatch?.name ?? parent.name,
        subcategories: (parent.subcategories ?? []).map((sub) =>
          patchSubcategory(sub, categoryPatches, dishPatches)
        ),
      };
    }),
    flatCategories: flatCategories.map((category) =>
      patchSubcategory(category, categoryPatches, dishPatches)
    ),
  };
}

function coerceLocalizedValue(
  raw: string | LocalizedTextValue | null | undefined
): LocalizedTextValue {
  if (raw == null) return "";
  if (typeof raw === "object") return raw;
  return parseLocalizedFieldFromDb(raw);
}

/** Resolve restaurant free-text fields that may be plain strings or LocalizedText JSON. */
export function resolvePublicRestaurantText(
  raw: string | LocalizedTextValue | null | undefined,
  locale: MenuContentLanguage,
  fallbackLocale: MenuContentLanguage
): string {
  return resolveLocalizedText(coerceLocalizedValue(raw), locale, fallbackLocale).trim();
}

export function resolvePublicHoursDisplay(
  raw: string | LocalizedTextValue | null | undefined,
  locale: MenuContentLanguage,
  fallbackLocale: MenuContentLanguage
): string {
  const resolved = resolvePublicRestaurantText(raw, locale, fallbackLocale);
  return localizeHoursDisplay(resolved, locale);
}

export async function requestPublicMenuTranslation(
  slug: string,
  targetLang: MenuContentLanguage
): Promise<{
  already_complete?: boolean;
  rate_limited?: boolean;
  categories: PublicMenuTranslatePatch[];
  dishes: PublicMenuTranslatePatch[];
  restaurant?: PublicMenuRestaurantTranslatePatch | null;
  tag_labels?: Record<string, string>;
} | null> {
  try {
    const response = await fetch("/api/public-menu-translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, target_lang: targetLang }),
    });
    if (!response.ok) return null;
    return (await response.json()) as {
      already_complete?: boolean;
      rate_limited?: boolean;
      categories: PublicMenuTranslatePatch[];
      dishes: PublicMenuTranslatePatch[];
      restaurant?: PublicMenuRestaurantTranslatePatch | null;
      tag_labels?: Record<string, string>;
    };
  } catch (error) {
    console.error("[requestPublicMenuTranslation]", error);
    return null;
  }
}
