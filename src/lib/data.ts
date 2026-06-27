import { createAnonClient, getSupabaseBrowserClient } from "./supabase";
import type { MenuItemWithTranslations, Restaurant, RestaurantFull } from "./types";
import type { PostgrestError } from "@supabase/supabase-js";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { RestaurantCreationError, logSupabaseFailure } from "./auth/errors";
import {
  ensureUserProfileReady,
  waitForAuthenticatedSession,
} from "./auth/session";

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

function normalizeRestaurantRow(row: Record<string, unknown>): Restaurant {
  return {
    ...(row as Restaurant),
    logo: (row.logo as string | null) ?? (row.logo_url as string | null) ?? null,
  };
}

async function fetchCategoriesWithDishes(restaurantId: string) {
  const supabase = createAnonClient();

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
    const supabase = createAnonClient();

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
          ...normalizeRestaurantRow(restaurantById),
          categories,
        } as RestaurantFull;
      }
      if (error.code === "PGRST116") return null;
      throw error;
    }

    if (!restaurant) return null;

    const categories = await fetchCategoriesWithDishes(restaurant.id);

    return {
      ...normalizeRestaurantRow(restaurant),
      categories,
    } as RestaurantFull;
  } catch (error) {
    console.error("Error fetching restaurant by slug:", error);
    return null;
  }
}

export async function fetchAllRestaurantSlugs(): Promise<string[]> {
  try {
    const supabase = createAnonClient();
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
  const session = await waitForAuthenticatedSession(supabase);
  return fetchAllRestaurants(session.user.id);
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

async function requireAuthenticatedUser(supabase: SupabaseClient): Promise<User> {
  const session = await waitForAuthenticatedSession(supabase);
  await ensureUserProfileReady(supabase, session.user);
  return session.user;
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
  const normalized = requestedSlug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!normalized) {
    throw new Error("URL slug is required.");
  }

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

async function insertRestaurantRecord(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  slug: string,
  logo?: string | null
): Promise<Restaurant> {
  const basePayload = {
    user_id: userId,
    name: name.trim(),
    slug,
  };

  const attempts: Record<string, unknown>[] = [basePayload];

  if (logo) {
    attempts.unshift({ ...basePayload, logo });
    attempts.unshift({ ...basePayload, logo_url: logo });
  }

  let lastError: PostgrestError | null = null;

  for (const payload of attempts) {
    try {
      const { data, error } = await supabase
        .from("restaurants")
        .insert(payload)
        .select("*")
        .single();

      if (!error && data) {
        return normalizeRestaurantRow(data);
      }

      lastError = error;
      logSupabaseFailure("restaurants.insert", error);

      if (error?.code !== "42703") {
        throw new RestaurantCreationError(error!, "insert");
      }
    } catch (error) {
      if (error instanceof RestaurantCreationError) {
        throw error;
      }

      if (error && typeof error === "object" && "code" in error) {
        throw new RestaurantCreationError(error as PostgrestError, "insert");
      }

      throw error;
    }
  }

  throw new RestaurantCreationError(
    lastError ?? {
      message: "Restaurant insert failed without a database response.",
      details: "No row returned from Supabase.",
      hint: "",
      code: "insert_failed",
    },
    "insert"
  );
}

export async function createRestaurant(input: CreateRestaurantInput): Promise<CreateRestaurantResult> {
  const supabase = getSupabaseBrowserClient();

  try {
    const user = await requireAuthenticatedUser(supabase);
    const { slug: finalSlug, adjusted: slugWasAdjusted } = await resolveUniqueRestaurantSlug(
      supabase,
      input.slug
    );

    const restaurant = await insertRestaurantRecord(
      supabase,
      user.id,
      input.name,
      finalSlug,
      input.logo
    );

    return {
      restaurant,
      finalSlug,
      slugWasAdjusted,
    };
  } catch (error) {
    if (error instanceof RestaurantCreationError) {
      throw error;
    }

    if (error instanceof Error) {
      throw error;
    }

    logSupabaseFailure("createRestaurant", error);
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
