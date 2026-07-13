import type { MenuBuilderDish } from "./menu-builder-types";

export function sortRecordsByDisplayOrder<T extends { display_order?: number | null }>(
  records: readonly T[]
): T[] {
  return [...(records ?? [])].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
  );
}

export function sortDishesByDisplayOrder(dishes: MenuBuilderDish[]): MenuBuilderDish[] {
  return sortRecordsByDisplayOrder(dishes);
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
