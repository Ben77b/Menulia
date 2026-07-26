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
import { compareMenuOrder, sortByMenuOrder } from "@/lib/menu-order";
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
    order_index: row.order_index ?? 0,
    dishes: sortByMenuOrder(dishesByCategoryId[row.id] ?? []),
  };
}

export function buildFlatCategories(
  categoryRows: CategoryRow[],
  dishesByCategoryId: Record<string, ReturnType<typeof mapDishRow>[]>
): PublicMenuSubcategory[] {
  const byId = new Map(categoryRows.map((row) => [row.id, row]));

  const leafRows = categoryRows
    .filter((row) => !categoryRows.some((child) => child.parent_id === row.id))
    .sort((a, b) => {
      const parentA = a.parent_id ? byId.get(a.parent_id) : null;
      const parentB = b.parent_id ? byId.get(b.parent_id) : null;
      const parentOrderA = parentA?.order_index ?? (a.parent_id ? 0 : a.order_index ?? 0);
      const parentOrderB = parentB?.order_index ?? (b.parent_id ? 0 : b.order_index ?? 0);
      if (parentOrderA !== parentOrderB) return parentOrderA - parentOrderB;
      return compareMenuOrder(a, b);
    });

  return leafRows.map((row) => rowToSubcategory(row, dishesByCategoryId));
}

const PUBLIC_DISH_COLUMNS_CORE =
  "id, category_id, name, description, price, image, tags, price_variations, created_at";
const PUBLIC_DISH_COLUMNS_BASE = `${PUBLIC_DISH_COLUMNS_CORE}, display_order`;
const PUBLIC_DISH_COLUMNS_WITH_HIDE_PRICE = `${PUBLIC_DISH_COLUMNS_BASE}, hide_price`;
const PUBLIC_DISH_COLUMNS_WITH_AVAILABILITY = `${PUBLIC_DISH_COLUMNS_WITH_HIDE_PRICE}, is_available`;
const PUBLIC_DISH_COLUMNS_CORE_WITH_AVAILABILITY = `${PUBLIC_DISH_COLUMNS_CORE}, is_available`;
const PUBLIC_DISH_COLUMNS_CORE_WITH_HIDE_PRICE = `${PUBLIC_DISH_COLUMNS_CORE}, hide_price`;

function stripPriceVariationsColumn(columns: string): string {
  return columns
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "price_variations")
    .join(", ");
}

function stripCreatedAtColumn(columns: string): string {
  return columns
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "created_at")
    .join(", ");
}

type DishQueryRow = Parameters<typeof mapDishRow>[0] & {
  category_id?: string | null;
  display_order?: number | null;
  created_at?: string | null;
};

async function selectDishesForCategories(
  supabase: ReturnType<typeof createAnonClient>,
  categoryIds: string[],
  columns: string,
  options?: { requireAvailable?: boolean; orderByDisplayOrder?: boolean }
) {
  let query = supabase.from("dishes").select(columns).in("category_id", categoryIds);

  if (options?.requireAvailable) {
    query = query.eq("is_available", true);
  }

  if (options?.orderByDisplayOrder) {
    query = query.order("display_order", { ascending: true }).order("id", { ascending: true });
  } else {
    query = query.order("id", { ascending: true });
  }

  return query;
}

async function selectDishesWithPriceVariationsFallback(
  supabase: ReturnType<typeof createAnonClient>,
  categoryIds: string[],
  columns: string,
  options?: { requireAvailable?: boolean; orderByDisplayOrder?: boolean }
) {
  let result = await selectDishesForCategories(supabase, categoryIds, columns, options);

  if (
    result.error &&
    isMissingColumnError(result.error) &&
    columns.includes("price_variations")
  ) {
    result = await selectDishesForCategories(
      supabase,
      categoryIds,
      stripPriceVariationsColumn(columns),
      options
    );
  }

  if (result.error && isMissingColumnError(result.error) && columns.includes("created_at")) {
    result = await selectDishesForCategories(
      supabase,
      categoryIds,
      stripCreatedAtColumn(columns),
      options
    );
  }

  // Older schemas may lack display_order — retry without that order clause.
  if (result.error && isMissingColumnError(result.error) && options?.orderByDisplayOrder) {
    result = await selectDishesForCategories(supabase, categoryIds, columns, {
      requireAvailable: options.requireAvailable,
      orderByDisplayOrder: false,
    });
  }

  return result;
}

function groupDishesByCategory(
  rows: DishQueryRow[]
): Record<string, ReturnType<typeof mapDishRow>[]> {
  const byCategory: Record<string, DishQueryRow[]> = {};

  for (const row of rows) {
    const categoryId = typeof row.category_id === "string" ? row.category_id : "";
    if (!categoryId) continue;
    if (!byCategory[categoryId]) byCategory[categoryId] = [];
    byCategory[categoryId].push(row);
  }

  const mapped: Record<string, ReturnType<typeof mapDishRow>[]> = {};
  for (const [categoryId, categoryRows] of Object.entries(byCategory)) {
    const ordered = sortByMenuOrder(categoryRows);
    mapped[categoryId] = ordered.flatMap((row) => {
      try {
        const dish = mapDishRow(row);
        return dish?.id ? [dish] : [];
      } catch (error) {
        console.error("[Supabase Audit Error]:", "public-menu-fetch.mapDishRow", error);
        return [];
      }
    });
  }

  return mapped;
}

/** One batched dishes query for all leaf categories (avoids N+1 waterfalls). */
async function fetchActiveDishesByCategoryIds(
  supabase: ReturnType<typeof createAnonClient>,
  categoryIds: string[]
): Promise<Record<string, ReturnType<typeof mapDishRow>[]>> {
  const empty: Record<string, ReturnType<typeof mapDishRow>[]> = {};
  for (const id of categoryIds) empty[id] = [];
  if (categoryIds.length === 0) return empty;

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
      categoryIds,
      attempt.columns,
      {
        requireAvailable: attempt.requireAvailable,
        orderByDisplayOrder: attempt.sortByDisplayOrder,
      }
    );

    if (error) {
      if (!isMissingColumnError(error)) {
        console.error("[Supabase Audit Error]:", "public-menu-fetch.dishes.batch", error);
        return empty;
      }
      continue;
    }

    const grouped = groupDishesByCategory((data ?? []) as DishQueryRow[]);
    return { ...empty, ...grouped };
  }

  return empty;
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
      .order("order_index", { ascending: true })
      .order("id", { ascending: true });

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
        .order("order_index", { ascending: true })
        .order("id", { ascending: true });
      categorySource = fallback.data;
      if (fallback.error) {
        console.error(
          "[Supabase Audit Error]:",
          "public-menu-fetch.categories.fallback",
          fallback.error
        );
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

    const categoryRows: CategoryRow[] = (categorySource ?? []).flatMap((category) => {
      try {
        if (!category?.id) return [];
        return [
          {
            id: category.id,
            name: parseLocalizedFieldFromDb(category.name),
            description:
              parseLocalizedFieldFromDb(
                (category as { description?: string | null }).description ?? null
              ) || null,
            layout_type: category.layout_type ?? "stacked",
            order_index: category.order_index ?? 0,
            parent_id: category.parent_id ?? null,
          } satisfies CategoryRow,
        ];
      } catch (error) {
        console.error("[Supabase Audit Error]:", "public-menu-fetch.categoryRow", error);
        return [];
      }
    });

    if (categoryRows.length === 0) {
      return { menu: [], flatCategories: [], hasNestedStructure: false };
    }

    const leafCategoryIds = categoryRows
      .filter((row) => !categoryRows.some((child) => child.parent_id === row.id))
      .map((row) => row.id);

    const dishesByCategoryId = await fetchActiveDishesByCategoryIds(
      supabase,
      leafCategoryIds
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
