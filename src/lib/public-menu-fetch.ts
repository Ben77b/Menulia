import { createAnonClient } from "@/lib/supabase";
import { isMissingColumnError } from "@/lib/restaurant-settings";
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
    description: row.description ?? null,
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

const PUBLIC_DISH_COLUMNS = "id, name, description, price, image, tags";
const PUBLIC_DISH_COLUMNS_WITH_AVAILABILITY = `${PUBLIC_DISH_COLUMNS}, is_available`;

async function fetchActiveDishesForCategory(
  supabase: ReturnType<typeof createAnonClient>,
  categoryId: string
): Promise<ReturnType<typeof mapDishRow>[]> {
  const { data: withOrder, error: orderError } = await supabase
    .from("dishes")
    .select(PUBLIC_DISH_COLUMNS_WITH_AVAILABILITY)
    .eq("category_id", categoryId)
    .eq("is_available", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (!orderError) {
    return (withOrder ?? []).map(mapDishRow);
  }

  if (!isMissingColumnError(orderError)) {
    return [];
  }

  const { data: withAvailability, error: availabilityError } = await supabase
    .from("dishes")
    .select(PUBLIC_DISH_COLUMNS_WITH_AVAILABILITY)
    .eq("category_id", categoryId)
    .eq("is_available", true)
    .order("created_at", { ascending: true });

  if (!availabilityError) {
    return (withAvailability ?? []).map(mapDishRow);
  }

  if (!isMissingColumnError(availabilityError)) {
    return [];
  }

  const { data: withoutAvailability, error: fallbackError } = await supabase
    .from("dishes")
    .select(PUBLIC_DISH_COLUMNS)
    .eq("category_id", categoryId)
    .order("created_at", { ascending: true });

  if (fallbackError) {
    return [];
  }

  return (withoutAvailability ?? []).map(mapDishRow);
}

export async function fetchPublicMenuData(restaurantId: string): Promise<{
  menu: PublicMenuParentCategory[];
  flatCategories: PublicMenuSubcategory[];
  hasNestedStructure: boolean;
}> {
  const supabase = createAnonClient();

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name, description, layout_type, order_index, parent_id")
    .eq("restaurant_id", restaurantId)
    .order("order_index", { ascending: true });

  let categorySource: Array<{
    id: string;
    name: string;
    description?: string | null;
    layout_type: string | null;
    order_index: number | null;
    parent_id: string | null;
  }> | null = categories;

  if (categoriesError && isMissingColumnError(categoriesError)) {
    const fallback = await supabase
      .from("categories")
      .select("id, name, layout_type, order_index, parent_id")
      .eq("restaurant_id", restaurantId)
      .order("order_index", { ascending: true });
    categorySource = fallback.data;
    if (fallback.error || !categorySource?.length) {
      return { menu: [], flatCategories: [], hasNestedStructure: false };
    }
  } else if (categoriesError || !categorySource?.length) {
    return { menu: [], flatCategories: [], hasNestedStructure: false };
  }

  const categoryRows: CategoryRow[] = categorySource.map((category) => ({
    id: category.id,
    name: category.name,
    description: (category as { description?: string | null }).description ?? null,
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
      dishesByCategoryId[categoryId] = await fetchActiveDishesForCategory(supabase, categoryId);
    })
  );

  const nested = hasNestedMenuStructure(categoryRows);

  return {
    menu: buildMenuHierarchy(categoryRows, dishesByCategoryId),
    flatCategories: buildFlatCategories(categoryRows, dishesByCategoryId),
    hasNestedStructure: nested,
  };
}
