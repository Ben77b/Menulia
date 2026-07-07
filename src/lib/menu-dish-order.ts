import type { MenuBuilderDish } from "./menu-builder-types";

export function sortDishesByDisplayOrder(dishes: MenuBuilderDish[]): MenuBuilderDish[] {
  return [...(dishes ?? [])].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
  );
}

export function computeNextDishDisplayOrder(dishes: MenuBuilderDish[]): number {
  const safe = dishes ?? [];
  if (!safe.length) return 0;
  return Math.max(...safe.map((dish) => dish.display_order ?? 0), 0) + 1;
}

export function normalizeDishDisplayOrder(
  dish: MenuBuilderDish,
  existingDishes: MenuBuilderDish[]
): MenuBuilderDish {
  const nextOrder = computeNextDishDisplayOrder(existingDishes);
  const resolvedOrder =
    typeof dish.display_order === "number" && dish.display_order > nextOrder - 1
      ? dish.display_order
      : nextOrder;

  return {
    ...dish,
    display_order: resolvedOrder,
  };
}
