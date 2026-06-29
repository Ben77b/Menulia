import type { PublicMenuDish } from "@/components/public/dish-card";
import type { PublicMenuParentCategory, PublicMenuSubcategory } from "@/lib/menu-hierarchy";
import { isFilterableTag } from "@/lib/dietary-tags";

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
    dish.tags.some((tag) => isFilterableTag(tag) && activeFilters.has(tag))
  );
}
