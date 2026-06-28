import { createAnonClient } from "@/lib/supabase";
import {
  buildMenuHierarchy,
  mapDishRow,
  type CategoryRow,
  type PublicMenuParentCategory,
} from "@/lib/menu-hierarchy";
import { fetchRestaurantLinks, type RestaurantLink } from "@/lib/restaurant-links";

export async function fetchPublicMenuData(restaurantId: string): Promise<{
  menu: PublicMenuParentCategory[];
  links: RestaurantLink[];
}> {
  const supabase = createAnonClient();

  const [{ data: categories, error: categoriesError }, links] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, layout_type, order_index, parent_id")
      .eq("restaurant_id", restaurantId)
      .order("order_index", { ascending: true }),
    fetchRestaurantLinks(restaurantId),
  ]);

  if (categoriesError || !categories?.length) {
    return { menu: [], links };
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
        .select("id, name, description, price, image, tags")
        .eq("category_id", categoryId)
        .order("created_at", { ascending: true });

      dishesByCategoryId[categoryId] = (dishes ?? []).map(mapDishRow);
    })
  );

  return {
    menu: buildMenuHierarchy(categoryRows, dishesByCategoryId),
    links,
  };
}
