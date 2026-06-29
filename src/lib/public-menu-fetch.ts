import { createAnonClient } from "@/lib/supabase";
import {
  buildMenuHierarchy,
  mapDishRow,
  type CategoryRow,
  type PublicMenuParentCategory,
  type PublicMenuSubcategory,
} from "@/lib/menu-hierarchy";
import { parseCustomLinks } from "@/lib/restaurant-links";

export function hasNestedMenuStructure(categoryRows: CategoryRow[]): boolean {
  return categoryRows.some((row) => row.parent_id !== null);
}

function rowToSubcategory(
  row: CategoryRow,
  dishesByCategoryId: Record<string, ReturnType<typeof mapDishRow>[]>
): PublicMenuSubcategory {
  return {
    id: row.id,
    name: row.name,
    layout_type: row.layout_type === "carousel" ? "carousel" : "stacked",
    dishes: dishesByCategoryId[row.id] ?? [],
  };
}

export function buildFlatCategories(
  categoryRows: CategoryRow[],
  dishesByCategoryId: Record<string, ReturnType<typeof mapDishRow>[]>
): PublicMenuSubcategory[] {
  const leafRows = categoryRows.filter(
    (row) => !categoryRows.some((child) => child.parent_id === row.id)
  );

  return leafRows.map((row) => rowToSubcategory(row, dishesByCategoryId));
}

export async function fetchPublicMenuData(restaurantId: string): Promise<{
  menu: PublicMenuParentCategory[];
  flatCategories: PublicMenuSubcategory[];
  hasNestedStructure: boolean;
}> {
  const supabase = createAnonClient();

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name, layout_type, order_index, parent_id")
    .eq("restaurant_id", restaurantId)
    .order("order_index", { ascending: true });

  if (categoriesError || !categories?.length) {
    return { menu: [], flatCategories: [], hasNestedStructure: false };
  }

  const categoryRows: CategoryRow[] = categories.map((category) => ({
    id: category.id,
    name: category.name,
    layout_type: category.layout_type ?? "stacked",
    order_index: category.order_index ?? 0,
    parent_id: category.parent_id ?? null,
  }));

  const leafCategoryIds = categoryRows
    .filter((row) => {
      const hasChildren = categoryRows.some((child) => child.parent_id === row.id);
      return !hasChildren;
    })
    .map((row) => row.id);

  const dishesByCategoryId: Record<string, ReturnType<typeof mapDishRow>[]> = {};

  await Promise.all(
    leafCategoryIds.map(async (categoryId) => {
      const { data: dishes } = await supabase
        .from("dishes")
        .select("id, name, description, price, image, tags, allergens")
        .eq("category_id", categoryId)
        .order("created_at", { ascending: true });

      dishesByCategoryId[categoryId] = (dishes ?? []).map(mapDishRow);
    })
  );

  const nested = hasNestedMenuStructure(categoryRows);

  return {
    menu: buildMenuHierarchy(categoryRows, dishesByCategoryId),
    flatCategories: buildFlatCategories(categoryRows, dishesByCategoryId),
    hasNestedStructure: nested,
  };
}
