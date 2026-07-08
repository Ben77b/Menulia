import type { PublicMenuDish } from "@/components/public/dish-card";
import type { LocalizedTextValue } from "@/lib/localized-text";

export interface CategoryRow {
  id: string;
  name: LocalizedTextValue;
  description?: LocalizedTextValue;
  layout_type: string;
  order_index: number;
  parent_id: string | null;
}

export interface PublicMenuSubcategory {
  id: string;
  name: LocalizedTextValue;
  description?: LocalizedTextValue;
  layout_type: "carousel" | "stacked";
  dishes: PublicMenuDish[];
}

export interface PublicMenuParentCategory {
  id: string;
  name: LocalizedTextValue;
  subcategories: PublicMenuSubcategory[];
}

import { parseDishTagsFromDb } from "@/lib/dietary-tags";
import { parseLocalizedFieldFromDb } from "@/lib/localized-text";

export function mapDishRow(dish: {
  id: string;
  name: LocalizedTextValue;
  description?: LocalizedTextValue;
  price?: string | number | null;
  hide_price?: boolean | null;
  image?: string | null;
  tags?: string[] | null;
  allergens?: string[] | null;
}): PublicMenuDish {
  const normalized = parseDishTagsFromDb(dish);
  return {
    id: dish.id,
    name: parseLocalizedFieldFromDb(dish.name),
    description: parseLocalizedFieldFromDb(dish.description ?? ""),
    price: typeof dish.price === "number" ? dish.price : parseFloat(String(dish.price)) || 0,
    hide_price: typeof dish.hide_price === "boolean" ? dish.hide_price : false,
    image: dish.image ?? null,
    tags: normalized.tags,
    allergens: normalized.allergens,
  };
}

export function buildMenuHierarchy(
  categoryRows: CategoryRow[],
  dishesByCategoryId: Record<string, PublicMenuDish[]>
): PublicMenuParentCategory[] {
  const sorted = [...categoryRows].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  const toSubcategory = (row: CategoryRow): PublicMenuSubcategory => ({
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    layout_type: row.layout_type === "carousel" ? "carousel" : "stacked",
    dishes: dishesByCategoryId[row.id] ?? [],
  });

  const parents = sorted.filter((row) => !row.parent_id);
  const childrenByParent = new Map<string, CategoryRow[]>();

  sorted
    .filter((row) => row.parent_id)
    .forEach((row) => {
      const list = childrenByParent.get(row.parent_id!) ?? [];
      list.push(row);
      childrenByParent.set(row.parent_id!, list);
    });

  if (parents.length === 0 && sorted.length > 0) {
    return sorted.map((row) => ({
      id: row.id,
      name: row.name,
      subcategories: [toSubcategory(row)],
    }));
  }

  return parents.map((parent) => {
    const childRows = childrenByParent.get(parent.id) ?? [];
    const subcategories =
      childRows.length > 0 ? childRows.map(toSubcategory) : [toSubcategory(parent)];

    return {
      id: parent.id,
      name: parent.name,
      subcategories,
    };
  });
}
