import type { PublicMenuDish } from "@/components/public/dish-card";
import type { PublicMenuParentCategory, PublicMenuSubcategory } from "@/lib/menu-hierarchy";
import { isFilterableTag } from "@/lib/dietary-tags";

export function sanitizePublicMenuDish(dish: PublicMenuDish): PublicMenuDish {
  return {
    id: dish.id ?? "",
    name: dish.name ?? "",
    description: dish.description ?? "",
    price: typeof dish.price === "number" && !Number.isNaN(dish.price) ? dish.price : 0,
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
      subcategories: (parent.subcategories ?? []).map(sanitizePublicMenuSubcategory),
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
    return menu.flatMap((parent) =>
      parent.subcategories.flatMap((subcategory) => subcategory.dishes)
    );
  }

  return flatCategories.flatMap((category) => category.dishes);
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
