import type { PublicMenuDish } from "@/components/public/dish-card";
import type { PublicMenuParentCategory, PublicMenuSubcategory } from "@/lib/menu-hierarchy";
import { fieldHasGuestTranslations, type LocalizedTextValue } from "@/lib/localized-text";
import { isFilterableTag } from "@/lib/dietary-tags";
import { normalizeCategoryLayoutType } from "@/lib/category-layout";
import { parsePriceVariationsFromDb } from "@/lib/price-variations";

/** Returns a trimmed image URL when non-empty; does not block on protocol. */
export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** @deprecated Use normalizeImageUrl — kept for existing imports. */
export function isRenderableImageUrl(url: string | null | undefined): url is string {
  return normalizeImageUrl(url) !== null;
}

export function sanitizePublicMenuDish(
  dish: PublicMenuDish | null | undefined
): PublicMenuDish | null {
  if (!dish || typeof dish !== "object") return null;

  const image = dish.image;
  const safeImage = normalizeImageUrl(image);

  return {
    id: dish.id ?? "",
    name: dish.name ?? "",
    description: dish.description ?? "",
    price: typeof dish.price === "number" && !Number.isNaN(dish.price) ? dish.price : 0,
    price_variations: parsePriceVariationsFromDb(dish.price_variations),
    hide_price: Boolean(dish.hide_price),
    image: safeImage,
    tags: Array.isArray(dish.tags) ? dish.tags.filter(Boolean) : [],
    allergens: Array.isArray(dish.allergens) ? dish.allergens.filter(Boolean) : [],
  };
}

export function sanitizePublicMenuSubcategory(
  subcategory: PublicMenuSubcategory | null | undefined
): PublicMenuSubcategory | null {
  if (!subcategory || typeof subcategory !== "object") return null;

  return {
    ...subcategory,
    id: subcategory.id ?? "",
    name: subcategory.name ?? "",
    description: subcategory.description ?? null,
    layout_type: normalizeCategoryLayoutType(subcategory.layout_type),
    dishes: (subcategory.dishes ?? [])
      .map(sanitizePublicMenuDish)
      .filter((dish): dish is PublicMenuDish => dish !== null),
  };
}

export function sanitizePublicMenuTree(
  menu: PublicMenuParentCategory[],
  flatCategories: PublicMenuSubcategory[]
): { menu: PublicMenuParentCategory[]; flatCategories: PublicMenuSubcategory[] } {
  return {
    menu: (menu ?? [])
      .map((parent) => {
        if (!parent || typeof parent !== "object") return null;
        const subcategories = (parent.subcategories ?? [])
          .map(sanitizePublicMenuSubcategory)
          .filter((sub): sub is PublicMenuSubcategory => sub !== null);
        return {
          ...parent,
          id: parent.id ?? "",
          name: parent.name ?? "",
          subcategories,
        } satisfies PublicMenuParentCategory;
      })
      .filter((parent): parent is PublicMenuParentCategory => parent !== null),
    flatCategories: (flatCategories ?? [])
      .map(sanitizePublicMenuSubcategory)
      .filter((category): category is PublicMenuSubcategory => category !== null),
  };
}

export function collectAllDishes(
  menu: PublicMenuParentCategory[],
  flatCategories: PublicMenuSubcategory[],
  hasNestedStructure: boolean
): PublicMenuDish[] {
  if (hasNestedStructure) {
    return (menu ?? []).flatMap((parent) =>
      (parent?.subcategories ?? []).flatMap((subcategory) => subcategory?.dishes ?? [])
    );
  }

  return (flatCategories ?? []).flatMap((category) => category?.dishes ?? []);
}

export function filterDishesByTags(
  dishes: PublicMenuDish[],
  activeFilters: Set<string>
): PublicMenuDish[] {
  if (activeFilters.size === 0) return dishes;
  return dishes.filter((dish) =>
    (dish.tags ?? []).some((tag) => isFilterableTag(tag) && activeFilters.has(tag))
  );
}

function collectMenuTextFields(
  menu: PublicMenuParentCategory[],
  flatCategories: PublicMenuSubcategory[],
  hasNestedStructure: boolean
): LocalizedTextValue[] {
  const fields: LocalizedTextValue[] = [];

  if (hasNestedStructure) {
    for (const parent of menu ?? []) {
      if (parent?.name != null) fields.push(parent.name);
      for (const subcategory of parent?.subcategories ?? []) {
        if (subcategory?.name != null) fields.push(subcategory.name);
        if (subcategory?.description) fields.push(subcategory.description);
        for (const dish of subcategory?.dishes ?? []) {
          if (dish?.name != null) fields.push(dish.name);
          if (dish?.description != null) fields.push(dish.description);
        }
      }
    }
    return fields;
  }

  for (const category of flatCategories ?? []) {
    if (category?.name != null) fields.push(category.name);
    if (category?.description) fields.push(category.description);
    for (const dish of category?.dishes ?? []) {
      if (dish?.name != null) fields.push(dish.name);
      if (dish?.description != null) fields.push(dish.description);
    }
  }

  return fields;
}

/** Show the public language toggle only after at least one menu field has been translated. */
export function menuHasGuestTranslations(
  menu: PublicMenuParentCategory[],
  flatCategories: PublicMenuSubcategory[],
  hasNestedStructure: boolean
): boolean {
  return collectMenuTextFields(menu, flatCategories, hasNestedStructure).some(
    fieldHasGuestTranslations
  );
}
