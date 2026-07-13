import type { PublicMenuDish } from "@/components/public/dish-card";
import type { PublicMenuParentCategory, PublicMenuSubcategory } from "@/lib/menu-hierarchy";
import { fieldHasGuestTranslations, type LocalizedTextValue } from "@/lib/localized-text";
import { isFilterableTag } from "@/lib/dietary-tags";

export function sanitizePublicMenuDish(dish: PublicMenuDish): PublicMenuDish {
  return {
    id: dish.id ?? "",
    name: dish.name ?? "",
    description: dish.description ?? "",
    price: typeof dish.price === "number" && !Number.isNaN(dish.price) ? dish.price : 0,
    hide_price: Boolean(dish.hide_price),
    image: dish.image ?? null,
    tags: Array.isArray(dish.tags) ? dish.tags : [],
    allergens: Array.isArray(dish.allergens) ? dish.allergens : [],
  };
}

export function sanitizePublicMenuSubcategory(
  subcategory: PublicMenuSubcategory
): PublicMenuSubcategory {
  return {
    ...subcategory,
    description: subcategory.description ?? null,
    dishes: (subcategory.dishes ?? []).map(sanitizePublicMenuDish),
  };
}

export function sanitizePublicMenuTree(
  menu: PublicMenuParentCategory[],
  flatCategories: PublicMenuSubcategory[]
): { menu: PublicMenuParentCategory[]; flatCategories: PublicMenuSubcategory[] } {
  return {
    menu: (menu ?? []).map((parent) => ({
      ...parent,
      id: parent?.id ?? "",
      name: parent?.name ?? "",
      subcategories: (parent?.subcategories ?? []).map(sanitizePublicMenuSubcategory),
    })),
    flatCategories: (flatCategories ?? []).map(sanitizePublicMenuSubcategory),
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
