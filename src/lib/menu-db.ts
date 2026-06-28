import { getSupabaseBrowserClient } from "./supabase";
import { logSupabaseFailure } from "./auth/errors";
import { isRestaurantUuid } from "./restaurant-id";

export interface MenuCategoryRecord {
  id: string;
  name: string;
  layout_type: "stacked" | "carousel";
  order_index: number;
  items: MenuDishRecord[];
}

export interface MenuDishRecord {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  tags: string[];
  is_available: boolean;
}

function mapDishRow(row: Record<string, unknown>): MenuDishRecord {
  const price = row.price;
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    description: String(row.description ?? ""),
    price: typeof price === "number" ? price : parseFloat(String(price)) || 0,
    image_url: (row.image_url as string | null) ?? (row.image as string | null) ?? null,
    tags: (row.tags as string[]) ?? [],
    is_available: row.is_available !== false,
  };
}

export async function fetchMenuCategories(restaurantId: string): Promise<MenuCategoryRecord[]> {
  const supabase = getSupabaseBrowserClient();

  const { data: categoriesData, error: categoriesError } = await supabase
    .from("categories")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("order_index", { ascending: true });

  if (categoriesError) {
    logSupabaseFailure("menu.fetchCategories", categoriesError);
    throw categoriesError;
  }

  const categories = categoriesData ?? [];

  return Promise.all(
    categories.map(async (category) => {
      const { data: dishesData, error: dishesError } = await supabase
        .from("dishes")
        .select("*")
        .eq("category_id", category.id)
        .order("created_at", { ascending: true });

      if (dishesError) {
        logSupabaseFailure("menu.fetchDishes", dishesError);
        throw dishesError;
      }

      return {
        id: category.id,
        name: category.name,
        layout_type: category.layout_type === "carousel" ? "carousel" : "stacked",
        order_index: category.order_index ?? 0,
        items: (dishesData ?? []).map((row) => mapDishRow(row)),
      };
    })
  );
}

export async function createMenuCategory(input: {
  restaurantId: string;
  name: string;
  layout_type: "stacked" | "carousel";
  order_index: number;
}): Promise<MenuCategoryRecord> {
  const supabase = getSupabaseBrowserClient();

  if (!isRestaurantUuid(input.restaurantId)) {
    throw new Error(
      `Invalid restaurant_id: expected a database UUID, received "${input.restaurantId}".`
    );
  }

  const payload = {
    restaurant_id: input.restaurantId,
    name: input.name.trim(),
    layout_type: input.layout_type,
    order_index: input.order_index,
  };

  console.log("[CategorySave:Payload]", payload);

  const { data, error } = await supabase.from("categories").insert(payload).select("*").single();

  if (error || !data) {
    logSupabaseFailure("menu.createCategory", error);
    throw error ?? new Error("Category insert failed.");
  }

  return {
    id: data.id,
    name: data.name,
    layout_type: data.layout_type === "carousel" ? "carousel" : "stacked",
    order_index: data.order_index ?? input.order_index,
    items: [],
  };
}

export async function updateMenuCategory(
  categoryId: string,
  updates: Partial<Pick<MenuCategoryRecord, "name" | "layout_type" | "order_index">>
): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase
    .from("categories")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", categoryId);

  if (error) {
    logSupabaseFailure("menu.updateCategory", error);
    throw error;
  }
}

export async function deleteMenuCategory(categoryId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase.from("categories").delete().eq("id", categoryId);

  if (error) {
    logSupabaseFailure("menu.deleteCategory", error);
    throw error;
  }
}

async function insertDishPayload(
  supabase: ReturnType<typeof getSupabaseBrowserClient>,
  payload: Record<string, unknown>
) {
  const attempts: Record<string, unknown>[] = [
    payload,
    { ...payload, image: payload.image_url ?? null },
  ];

  let lastError = null;

  for (const attempt of attempts) {
    const cleaned = { ...attempt };
    if (cleaned.image_url === undefined) {
      delete cleaned.image_url;
    }

    const { data, error } = await supabase.from("dishes").insert(cleaned).select("*").single();

    if (!error && data) {
      return data;
    }

    lastError = error;
    if (error?.code !== "42703") {
      break;
    }
  }

  logSupabaseFailure("menu.createDish", lastError);
  throw lastError ?? new Error("Dish insert failed.");
}

export async function createMenuDish(input: {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image_url?: string | null;
  tags?: string[];
}): Promise<MenuDishRecord> {
  const supabase = getSupabaseBrowserClient();

  const data = await insertDishPayload(supabase, {
    category_id: input.categoryId,
    name: input.name.trim(),
    description: input.description.trim(),
    price: String(input.price),
    image_url: input.image_url ?? null,
    tags: input.tags ?? [],
  });

  return mapDishRow(data);
}

export async function updateMenuDish(
  dishId: string,
  input: {
    name: string;
    description: string;
    price: number;
    image_url?: string | null;
    tags?: string[];
  }
): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  const baseUpdate = {
    name: input.name.trim(),
    description: input.description.trim(),
    price: String(input.price),
    tags: input.tags ?? [],
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("dishes")
    .update({
      ...baseUpdate,
      image_url: input.image_url ?? null,
    })
    .eq("id", dishId);

  if (error?.code === "42703") {
    const { error: fallbackError } = await supabase
      .from("dishes")
      .update({
        ...baseUpdate,
        image: input.image_url ?? null,
      })
      .eq("id", dishId);

    if (fallbackError) {
      logSupabaseFailure("menu.updateDish", fallbackError);
      throw fallbackError;
    }

    return;
  }

  if (error) {
    logSupabaseFailure("menu.updateDish", error);
    throw error;
  }
}

export async function deleteMenuDish(dishId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase.from("dishes").delete().eq("id", dishId);

  if (error) {
    logSupabaseFailure("menu.deleteDish", error);
    throw error;
  }
}

export async function updateRestaurantBranding(
  restaurantId: string,
  branding: {
    theme_colors: Record<string, unknown>;
    typography: Record<string, unknown>;
  }
): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase
    .from("restaurants")
    .update({
      theme_colors: branding.theme_colors,
      typography: branding.typography,
      updated_at: new Date().toISOString(),
    })
    .eq("id", restaurantId);

  if (error) {
    logSupabaseFailure("restaurants.updateBranding", error);
    throw error;
  }
}
