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
  layout_type: CategoryLayoutType;
  dishes: PublicMenuDish[];
}

export interface PublicMenuParentCategory {
  id: string;
  name: LocalizedTextValue;
  subcategories: PublicMenuSubcategory[];
}

import { parseDishTagsFromDb } from "@/lib/dietary-tags";
import { parseLocalizedFieldFromDb } from "@/lib/localized-text";
import { parsePriceVariationsFromDb } from "@/lib/price-variations";
import {
  normalizeCategoryLayoutType,
  type CategoryLayoutType,
} from "@/lib/category-layout";

export function mapDishRow(dish: {
  id: string;
  name: LocalizedTextValue;
  description?: LocalizedTextValue;
  price?: string | number | null;
  price_variations?: unknown;
  hide_price?: boolean | null;
  image?: string | null;
  tags?: string[] | null;
  allergens?: string[] | null;
}): PublicMenuDish {
  try {
    const normalized = parseDishTagsFromDb(dish ?? {});
    const priceVariations = parsePriceVariationsFromDb(dish?.price_variations);
    return {
      id: String(dish?.id ?? ""),
      name: parseLocalizedFieldFromDb(dish?.name),
      description: parseLocalizedFieldFromDb(dish?.description ?? ""),
      price:
        typeof dish?.price === "number"
          ? dish.price
          : parseFloat(String(dish?.price ?? "")) || 0,
      price_variations: priceVariations,
      hide_price: typeof dish?.hide_price === "boolean" ? dish.hide_price : false,
      image: typeof dish?.image === "string" ? dish.image : null,
      tags: normalized.tags,
      allergens: normalized.allergens,
    };
  } catch (error) {
    console.error("[mapDishRow]", error);
    return {
      id: String(dish?.id ?? ""),
      name: typeof dish?.name === "string" ? dish.name : "",
      description: "",
      price: 0,
      price_variations: [],
      hide_price: false,
      image: null,
      tags: [],
      allergens: [],
    };
  }
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
    layout_type: normalizeCategoryLayoutType(row.layout_type),
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
