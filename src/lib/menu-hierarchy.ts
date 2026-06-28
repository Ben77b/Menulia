import type { PublicMenuDish } from "@/components/public/dish-card";

export interface CategoryRow {
  id: string;
  name: string;
  layout_type: string;
  order_index: number;
  parent_id: string | null;
}

export interface PublicMenuSubcategory {
  id: string;
  name: string;
  layout_type: "carousel" | "stacked";
  dishes: PublicMenuDish[];
}

export interface PublicMenuParentCategory {
  id: string;
  name: string;
  subcategories: PublicMenuSubcategory[];
}

export function mapDishRow(dish: {
  id: string;
  name: string;
  description?: string | null;
  price?: string | number | null;
  image?: string | null;
  tags?: string[] | null;
}): PublicMenuDish {
  return {
    id: dish.id,
    name: dish.name,
    description: dish.description || "",
    price: typeof dish.price === "number" ? dish.price : parseFloat(String(dish.price)) || 0,
    image: dish.image ?? null,
    tags: Array.isArray(dish.tags) ? dish.tags : [],
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
