import { supabase } from "./supabase";
import type { MenuItemWithTranslations, Restaurant, RestaurantFull } from "./types";

function mapDish(dish: Record<string, unknown>): MenuItemWithTranslations {
  const price = dish.price;
  return {
    id: dish.id as string,
    category_id: dish.category_id as string,
    name: dish.name as string,
    description: (dish.description as string) || "",
    price: typeof price === "number" ? price : parseFloat(String(price)) || 0,
    image_url: (dish.image_url as string) ?? (dish.image as string) ?? null,
    allergens: (dish.allergens as string[]) || [],
    is_available: dish.is_available !== false,
    tags: (dish.tags as string[]) || [],
    translations: [],
  };
}

async function fetchCategoriesWithDishes(restaurantId: string) {
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("order_index", { ascending: true });

  if (categoriesError) throw categoriesError;

  return Promise.all(
    (categories || []).map(async (category) => {
      const { data: dishes, error: dishesError } = await supabase
        .from("dishes")
        .select("*")
        .eq("category_id", category.id)
        .order("order_index", { ascending: true });

      if (dishesError) throw dishesError;

      return {
        id: category.id,
        restaurant_id: category.restaurant_id,
        name: category.name,
        sort_order: category.order_index ?? category.sort_order ?? 0,
        layout_type: category.layout_type,
        items: (dishes || []).map(mapDish),
      };
    })
  );
}

export async function fetchRestaurantBySlug(slug: string): Promise<RestaurantFull | null> {
  try {
    const { data: restaurant, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      if (error.code === "42703") {
        const { data: restaurantById, error: idError } = await supabase
          .from("restaurants")
          .select("*")
          .eq("id", slug)
          .single();

        if (idError) throw idError;
        if (!restaurantById) return null;

        const categories = await fetchCategoriesWithDishes(restaurantById.id);

        return {
          ...restaurantById,
          slug: restaurantById.id,
          categories,
        } as RestaurantFull;
      }
      if (error.code === "PGRST116") return null;
      throw error;
    }

    if (!restaurant) return null;

    const categories = await fetchCategoriesWithDishes(restaurant.id);

    return {
      ...restaurant,
      categories,
    } as RestaurantFull;
  } catch (error) {
    console.error("Error fetching restaurant by slug:", error);
    return null;
  }
}

export async function fetchAllRestaurantSlugs(): Promise<string[]> {
  try {
    const { data, error } = await supabase.from("restaurants").select("id, slug");

    if (error) {
      if (error.code === "42703") {
        const { data: restaurants, error: idError } = await supabase.from("restaurants").select("id");

        if (idError) throw idError;
        return (restaurants || []).map((r) => r.id);
      }
      throw error;
    }

    return (data || []).map((r) => r.slug || r.id);
  } catch (error) {
    console.error("Error fetching restaurant slugs:", error);
    return [];
  }
}

export async function fetchAllRestaurants(userId: string): Promise<Restaurant[]> {
  try {
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data || []) as Restaurant[];
  } catch (error) {
    console.error("Error fetching all restaurants:", error);
    return [];
  }
}

export async function fetchRestaurantsForAuthenticatedUser(): Promise<Restaurant[]> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) return [];

  return fetchAllRestaurants(user.id);
}

export interface CreateRestaurantInput {
  name: string;
  slug: string;
  logo?: string | null;
}

export async function createRestaurant(input: CreateRestaurantInput): Promise<Restaurant> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("You must be signed in to create a restaurant.");

  const { data: existing, error: slugError } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", input.slug)
    .maybeSingle();

  if (slugError) throw slugError;
  if (existing) throw new Error("This URL slug is already taken. Please choose another.");

  const { data, error } = await supabase
    .from("restaurants")
    .insert({
      user_id: user.id,
      name: input.name.trim(),
      slug: input.slug.trim(),
      logo: input.logo ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Restaurant;
}

export async function uploadRestaurantLogo(file: File, userId: string): Promise<string> {
  const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Please upload a PNG, JPEG, or WebP image.");
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("Please upload an image smaller than 5MB.");
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `logos/${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage.from("menu-images").upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("menu-images").getPublicUrl(fileName);

  return publicUrl;
}

export async function fetchDemoRestaurant() {
  return null;
}

export async function fetchReservations(_restaurantId: string) {
  return [];
}

export async function fetchPageViews(_restaurantId: string) {
  return [];
}

export async function fetchExpenses(_restaurantId: string) {
  return [];
}
