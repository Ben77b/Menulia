import { parseDishTagsFromDb, serializeDishTagsForDb } from "./dietary-tags";
import { getSupabaseBrowserClient } from "./supabase";
import { logSupabaseFailure } from "./auth/errors";

export interface MenuCategoryRecord {
  id: string;
  name: string;
  layout_type: string;
  order_index: number;
  parent_id: string | null;
  items: MenuDishRecord[];
}

export interface MenuDishRecord {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  tags: string[];
  allergens: string[];
  is_available: boolean;
}

export async function fetchMenuCategories(restaurantId: string): Promise<MenuCategoryRecord[]> {
  const supabase = getSupabaseBrowserClient();

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("order_index", { ascending: true });

  if (categoriesError) {
    logSupabaseFailure("menu.fetchCategories", categoriesError);
    throw categoriesError;
  }

  const rows = categories ?? [];

  return Promise.all(
    rows.map(async (category) => {
      const { data: dishes, error: dishesError } = await supabase
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
        layout_type: category.layout_type ?? "stacked",
        order_index: category.order_index ?? 0,
        parent_id: category.parent_id ?? null,
        items: (dishes ?? []).map((dish) => {
          const normalized = parseDishTagsFromDb(dish);
          return {
            id: dish.id,
            name: dish.name,
            description: dish.description ?? "",
            price: parseFloat(String(dish.price)) || 0,
            image_url: dish.image ?? null,
            tags: normalized.tags,
            allergens: normalized.allergens,
            is_available: true,
          };
        }),
      };
    })
  );
}

export async function createMenuCategory(
  name: string,
  restaurantId: string,
  options?: {
    layout_type?: "stacked" | "carousel";
    parent_id?: string | null;
  }
): Promise<MenuCategoryRecord> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("categories")
    .insert({
      name: name.trim(),
      restaurant_id: restaurantId,
      layout_type: options?.layout_type ?? "stacked",
      parent_id: options?.parent_id ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    logSupabaseFailure("menu.createCategory", error);
    throw error ?? new Error("Category insert failed.");
  }

  return {
    id: data.id,
    name: data.name,
    layout_type: data.layout_type ?? "stacked",
    order_index: data.order_index ?? 0,
    parent_id: data.parent_id ?? null,
    items: [],
  };
}

export async function updateMenuCategory(
  categoryId: string,
  updates: Partial<Pick<MenuCategoryRecord, "name" | "layout_type" | "order_index" | "parent_id">>
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("categories").update(updates).eq("id", categoryId);

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

export async function createMenuDish(
  categoryId: string,
  name: string,
  description: string,
  price: number,
  image: string | null = null,
  tags: string[] = [],
  allergens: string[] = []
): Promise<MenuDishRecord> {
  const supabase = getSupabaseBrowserClient();
  const tagsForDb = serializeDishTagsForDb(tags, allergens);

  const { data, error } = await supabase
    .from("dishes")
    .insert({
      category_id: categoryId,
      name: name.trim(),
      description: description.trim(),
      price: String(price),
      image,
      tags: tagsForDb,
    })
    .select("*")
    .single();

  if (error || !data) {
    logSupabaseFailure("menu.createDish", error);
    throw error ?? new Error("Dish insert failed.");
  }

  const saved = parseDishTagsFromDb(data);

  return {
    id: data.id,
    name: data.name,
    description: data.description ?? "",
    price: parseFloat(String(data.price)) || 0,
    image_url: data.image ?? null,
    tags: saved.tags,
    allergens: saved.allergens,
    is_available: true,
  };
}

export async function updateMenuDish(
  dishId: string,
  name: string,
  description: string,
  price: number,
  image: string | null = null,
  tags: string[] = [],
  allergens: string[] = []
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const tagsForDb = serializeDishTagsForDb(tags, allergens);

  const { error } = await supabase
    .from("dishes")
    .update({
      name: name.trim(),
      description: description.trim(),
      price: String(price),
      image,
      tags: tagsForDb,
    })
    .eq("id", dishId);

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
