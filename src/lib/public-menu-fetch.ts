import { createAnonClient } from "@/lib/supabase";
import { isMissingColumnError } from "@/lib/restaurant-settings";
import { parseLocalizedFieldFromDb } from "@/lib/localized-text";
import {
  buildMenuHierarchy,
  mapDishRow,
  type CategoryRow,
  type PublicMenuParentCategory,
  type PublicMenuSubcategory,
} from "@/lib/menu-hierarchy";
import { parseCustomLinks } from "@/lib/restaurant-links";
import { sortRecordsByDisplayOrder } from "@/lib/menu-dish-order";
import { normalizeCategoryLayoutType } from "@/lib/category-layout";

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
    layout_type: normalizeCategoryLayoutType(row.layout_type),
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

const PUBLIC_DISH_COLUMNS_CORE = "id, name, description, price, image, tags, price_variations";
const PUBLIC_DISH_COLUMNS_BASE = `${PUBLIC_DISH_COLUMNS_CORE}, display_order`;
const PUBLIC_DISH_COLUMNS_WITH_HIDE_PRICE = `${PUBLIC_DISH_COLUMNS_BASE}, hide_price`;
const PUBLIC_DISH_COLUMNS_WITH_AVAILABILITY = `${PUBLIC_DISH_COLUMNS_WITH_HIDE_PRICE}, is_available`;
const PUBLIC_DISH_COLUMNS_CORE_WITH_AVAILABILITY = `${PUBLIC_DISH_COLUMNS_CORE}, is_available`;
const PUBLIC_DISH_COLUMNS_CORE_WITH_HIDE_PRICE = `${PUBLIC_DISH_COLUMNS_CORE}, hide_price`;

function sortDishRowsByDisplayOrder<T extends { display_order?: number | null }>(
  rows: T[]
): T[] {
  return sortRecordsByDisplayOrder(rows);
}

function stripPriceVariationsColumn(columns: string): string {
  return columns
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "price_variations")
    .join(", ");
}

async function selectDishesForCategory(
  supabase: ReturnType<typeof createAnonClient>,
  categoryId: string,
  columns: string,
  options?: { requireAvailable?: boolean }
) {
  let query = supabase
    .from("dishes")
    .select(columns)
    .eq("category_id", categoryId)
    .order("created_at", { ascending: true });

  if (options?.requireAvailable) {
    query = query.eq("is_available", true);
  }

  return query;
}

async function selectDishesWithPriceVariationsFallback(
  supabase: ReturnType<typeof createAnonClient>,
  categoryId: string,
  columns: string,
  options?: { requireAvailable?: boolean }
) {
  let result = await selectDishesForCategory(supabase, categoryId, columns, options);

  if (
    result.error &&
    isMissingColumnError(result.error) &&
    columns.includes("price_variations")
  ) {
    result = await selectDishesForCategory(
      supabase,
      categoryId,
      stripPriceVariationsColumn(columns),
      options
    );
  }

  return result;
}

async function fetchActiveDishesForCategory(
  supabase: ReturnType<typeof createAnonClient>,
  categoryId: string
): Promise<ReturnType<typeof mapDishRow>[]> {
  const attempts: Array<{
    columns: string;
    requireAvailable: boolean;
    sortByDisplayOrder: boolean;
  }> = [
    {
      columns: PUBLIC_DISH_COLUMNS_WITH_AVAILABILITY,
      requireAvailable: true,
      sortByDisplayOrder: true,
    },
    {
      columns: PUBLIC_DISH_COLUMNS_BASE,
      requireAvailable: false,
      sortByDisplayOrder: true,
    },
    {
      columns: PUBLIC_DISH_COLUMNS_WITH_HIDE_PRICE,
      requireAvailable: false,
      sortByDisplayOrder: true,
    },
    {
      columns: PUBLIC_DISH_COLUMNS_CORE_WITH_AVAILABILITY,
      requireAvailable: true,
      sortByDisplayOrder: false,
    },
    {
      columns: PUBLIC_DISH_COLUMNS_CORE_WITH_HIDE_PRICE,
      requireAvailable: false,
      sortByDisplayOrder: false,
    },
    {
      columns: PUBLIC_DISH_COLUMNS_CORE,
      requireAvailable: false,
      sortByDisplayOrder: false,
    },
  ];

  for (const attempt of attempts) {
    const { data, error } = await selectDishesWithPriceVariationsFallback(
      supabase,
      categoryId,
      attempt.columns,
      { requireAvailable: attempt.requireAvailable }
    );

    if (error) {
      if (!isMissingColumnError(error)) return [];
      continue;
    }

    const rows = attempt.sortByDisplayOrder
      ? sortDishRowsByDisplayOrder(data ?? [])
      : data ?? [];
    return rows.map(mapDishRow);
  }

  return [];
}

export async function fetchPublicMenuData(restaurantId: string): Promise<{
  menu: PublicMenuParentCategory[];
  flatCategories: PublicMenuSubcategory[];
  hasNestedStructure: boolean;
}> {
  try {
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
      if (fallback.error) {
        console.error("[Supabase Audit Error]:", "public-menu-fetch.categories.fallback", fallback.error);
      }
      if (fallback.error || !categorySource?.length) {
        return { menu: [], flatCategories: [], hasNestedStructure: false };
      }
    } else if (categoriesError || !categorySource?.length) {
      if (categoriesError) {
        console.error("[Supabase Audit Error]:", "public-menu-fetch.categories", categoriesError);
      }
      return { menu: [], flatCategories: [], hasNestedStructure: false };
    }

    const categoryRows: CategoryRow[] = categorySource.map((category) => ({
      id: category.id,
      name: parseLocalizedFieldFromDb(category.name),
      description: parseLocalizedFieldFromDb(
        (category as { description?: string | null }).description ?? null
      ) || null,
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
        try {
          dishesByCategoryId[categoryId] = await fetchActiveDishesForCategory(supabase, categoryId);
        } catch (error) {
          console.error("[Supabase Audit Error]:", "public-menu-fetch.dishes", categoryId, error);
          dishesByCategoryId[categoryId] = [];
        }
      })
    );

    const nested = hasNestedMenuStructure(categoryRows);

    return {
      menu: buildMenuHierarchy(categoryRows, dishesByCategoryId),
      flatCategories: buildFlatCategories(categoryRows, dishesByCategoryId),
      hasNestedStructure: nested,
    };
  } catch (error) {
    console.error("[Supabase Audit Error]:", "public-menu-fetch.fetchPublicMenuData", error);
    return { menu: [], flatCategories: [], hasNestedStructure: false };
  }
}
