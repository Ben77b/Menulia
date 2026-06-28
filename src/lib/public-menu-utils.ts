import type { PublicMenuDish } from "@/components/public/dish-card";
import type { PublicMenuParentCategory, PublicMenuSubcategory } from "@/lib/menu-hierarchy";
import { getTagMeta } from "@/lib/dietary-tags";

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
    dish.tags.some((tag) => activeFilters.has(tag))
  );
}

export function collectMenuTags(dishes: PublicMenuDish[]): string[] {
  const tags = new Set<string>();
  for (const dish of dishes) {
    for (const tag of dish.tags) {
      tags.add(tag);
    }
  }

  return Array.from(tags).sort((a, b) => {
    const labelA = getTagMeta(a).label;
    const labelB = getTagMeta(b).label;
    return labelA.localeCompare(labelB);
  });
}
