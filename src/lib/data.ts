import { createAnonClient, getSupabaseBrowserClient } from "./supabase";
import type { MenuItemWithTranslations, Restaurant, RestaurantFull } from "./types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { RestaurantCreationError, formatSupabaseError, logSupabaseFailure } from "./auth/errors";
import { ensureUserProfileReady } from "./auth/session";

const SLUG_PATTERN = /^[a-z0-9-]+$/;

function normalizeRestaurantSlug(rawSlug: string): string {
  const normalized = rawSlug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!normalized || !SLUG_PATTERN.test(normalized)) {
    throw new Error("URL slug must contain only lowercase letters, numbers, and hyphens.");
  }

  return normalized;
}

import { parseDishTagsFromDb } from "./dietary-tags";

function mapDish(dish: Record<string, unknown>): MenuItemWithTranslations {
  const price = dish.price;
  const normalized = parseDishTagsFromDb({
    tags: dish.tags as string[] | undefined,
    allergens: dish.allergens as string[] | undefined,
  });
  return {
    id: dish.id as string,
    category_id: dish.category_id as string,
    name: dish.name as string,
    description: (dish.description as string) || "",
    price: typeof price === "number" ? price : parseFloat(String(price)) || 0,
    image_url: (dish.image as string) ?? null,
    allergens: normalized.allergens,
    is_available: dish.is_available !== false,
    tags: normalized.tags,
    translations: [],
  };
}

function normalizeRestaurantRow(row: Record<string, unknown>): Restaurant {
  return {
    ...(row as unknown as Restaurant),
    logo: (row.logo as string | null) ?? (row.logo_url as string | null) ?? null,
  };
}

export async function attachMenuCategories(
  restaurant: Record<string, unknown>
): Promise<RestaurantFull> {
  const normalized = normalizeRestaurantRow(restaurant);
  const categories = await fetchCategoriesWithDishes(normalized.id);
  return {
    ...normalized,
    categories,
  } as RestaurantFull;
}

async function fetchCategoriesWithDishes(restaurantId: string) {
  const supabase = createAnonClient();

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("order_index", { ascending: true });

  if (categoriesError) {
    logSupabaseFailure("fetchCategoriesWithDishes.categories", categoriesError);
    return [];
  }

  if (!categories?.length) {
    return [];
  }

  return Promise.all(
    categories.map(async (category) => {
      const { data: dishes, error: dishesError } = await supabase
        .from("dishes")
        .select("*")
        .eq("category_id", category.id)
        .order("created_at", { ascending: true });

      if (dishesError) {
        logSupabaseFailure("fetchCategoriesWithDishes.dishes", dishesError);
      }

      return {
        id: category.id,
        restaurant_id: category.restaurant_id,
        name: category.name,
        sort_order: category.order_index ?? 0,
        layout_type: category.layout_type ?? "stacked",
        items: dishesError ? [] : (dishes ?? []).map(mapDish),
      };
    })
  );
}

export async function fetchRestaurantBySlug(slug: string): Promise<RestaurantFull | null> {
  const supabase = createAnonClient();

  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    logSupabaseFailure("fetchRestaurantBySlug", error);
    return null;
  }

  if (!restaurant) return null;

  const categories = await fetchCategoriesWithDishes(restaurant.id);

  return {
    ...normalizeRestaurantRow(restaurant),
    categories,
  } as RestaurantFull;
}

export async function fetchAllRestaurantSlugs(): Promise<string[]> {
  try {
    const supabase = createAnonClient();
    const { data, error } = await supabase.from("restaurants").select("slug");

    if (error) {
      logSupabaseFailure("fetchAllRestaurantSlugs", error);
      return [];
    }

    return (data || [])
      .map((row) => row.slug)
      .filter((slug): slug is string => typeof slug === "string" && slug.length > 0);
  } catch (error) {
    console.error("Error fetching restaurant slugs:", error);
    return [];
  }
}

export async function fetchAllRestaurants(userId: string): Promise<Restaurant[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    logSupabaseFailure("fetchAllRestaurants", error);
    throw error;
  }

  return (data || []).map((row) => normalizeRestaurantRow(row));
}

export async function fetchRestaurantsForAuthenticatedUser(): Promise<Restaurant[]> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in to load restaurants.");
  }

  return fetchAllRestaurants(user.id);
}

export interface CreateRestaurantInput {
  name: string;
  slug: string;
  logo?: string | null;
}

export interface CreateRestaurantResult {
  restaurant: Restaurant;
  finalSlug: string;
  slugWasAdjusted: boolean;
}

async function isSlugTaken(supabase: SupabaseClient, slug: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    logSupabaseFailure("restaurants.slugCheck", error);
    throw new RestaurantCreationError(error, "slugCheck");
  }

  return Boolean(data);
}

function randomSlugSuffix(): string {
  return String(Math.floor(100 + Math.random() * 900));
}

export async function resolveUniqueRestaurantSlug(
  supabase: SupabaseClient,
  requestedSlug: string
): Promise<{ slug: string; adjusted: boolean }> {
  const normalized = normalizeRestaurantSlug(requestedSlug);

  if (!(await isSlugTaken(supabase, normalized))) {
    return { slug: normalized, adjusted: false };
  }

  for (let attempt = 0; attempt < 12; attempt++) {
    const candidate = `${normalized}-${randomSlugSuffix()}`;
    if (!(await isSlugTaken(supabase, candidate))) {
      return { slug: candidate, adjusted: true };
    }
  }

  return {
    slug: `${normalized}-${Date.now().toString().slice(-6)}`,
    adjusted: true,
  };
}

export async function createRestaurant(input: CreateRestaurantInput): Promise<CreateRestaurantResult> {
  const supabase = getSupabaseBrowserClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.dir(userError, { depth: null });
      throw new Error(formatSupabaseError(userError));
    }

    if (!user?.id) {
      throw new Error("You must be signed in to create a restaurant.");
    }

    await ensureUserProfileReady(supabase, user);

    const { slug: finalSlug, adjusted: slugWasAdjusted } = await resolveUniqueRestaurantSlug(
      supabase,
      input.slug
    );

    const { data, error } = await supabase
      .from("restaurants")
      .insert({
        name: input.name.trim(),
        slug: finalSlug,
        user_id: user.id,
      })
      .select("*")
      .single();

    if (error) {
      console.dir(error, { depth: null });
      throw new RestaurantCreationError(error, "insert");
    }

    if (!data) {
      throw new Error("Restaurant insert succeeded but no row was returned.");
    }

    if (input.logo) {
      const { error: logoError } = await supabase
        .from("restaurants")
        .update({ logo_url: input.logo })
        .eq("id", data.id);

      if (logoError) {
        console.dir(logoError, { depth: null });
      }
    }

    const restaurant = normalizeRestaurantRow(data);

    return {
      restaurant: {
        ...restaurant,
        user_id: user.id,
        slug: finalSlug,
      },
      finalSlug,
      slugWasAdjusted,
    };
  } catch (error) {
    console.dir(error, { depth: null });

    if (error instanceof RestaurantCreationError) {
      throw error;
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to create restaurant.");
  }
}

export async function waitForRestaurantInList(
  refreshRestaurants: () => Promise<Array<{ id: string }>>,
  restaurantId: string,
  maxAttempts = 10,
  delayMs = 250
): Promise<Array<{ id: string }>> {
  let restaurants = await refreshRestaurants();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (restaurants.some((restaurant) => restaurant.id === restaurantId)) {
      return restaurants;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
    restaurants = await refreshRestaurants();
  }

  return restaurants;
}

export async function uploadRestaurantLogo(file: File, userId: string): Promise<string> {
  const supabase = getSupabaseBrowserClient();
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

  if (uploadError) {
    logSupabaseFailure("logoUpload", uploadError);
    throw uploadError;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("menu-images").getPublicUrl(fileName);

  return publicUrl;
}
