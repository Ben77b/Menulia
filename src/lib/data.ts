import { createAnonClient, getSupabaseBrowserClient } from "./supabase";
import type { MenuItemWithTranslations, Restaurant, RestaurantFull } from "./types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { RestaurantCreationError, logSupabaseFailure } from "./auth/errors";
import { ensureUserProfileReady } from "./auth/session";
import { ensureRestaurantsSchemaReady } from "./db/ensure-restaurants-schema";
import {
  buildRestaurantInsertPayload,
  normalizeRestaurantSlug,
  resolveRestaurantOwnerFromRow,
  resolveRestaurantSlugFromRow,
  RESTAURANT_SLUG_COLUMN,
} from "./restaurant-schema";

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
    user_id: resolveRestaurantOwnerFromRow(row),
    slug: resolveRestaurantSlugFromRow(row),
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
      .eq(RESTAURANT_SLUG_COLUMN, slug)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      logSupabaseFailure("fetchRestaurantBySlug", error);
      return null;
    }

    let resolvedRestaurant = restaurant;

    if (!resolvedRestaurant) {
      const { data: restaurantById, error: idError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", slug)
        .maybeSingle();

      if (idError && idError.code !== "PGRST116") {
        logSupabaseFailure("fetchRestaurantBySlug.idFallback", idError);
        return null;
      }

      resolvedRestaurant = restaurantById;
    }

    if (!resolvedRestaurant) return null;

    const categories = await fetchCategoriesWithDishes(String(resolvedRestaurant.id));

    return {
      ...normalizeRestaurantRow(resolvedRestaurant),
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
      logSupabaseFailure("fetchAllRestaurantSlugs", error);
      return [];
    }

    return (data || []).map((row) => resolveRestaurantSlugFromRow(row));
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
    .eq(RESTAURANT_SLUG_COLUMN, slug)
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
  await ensureRestaurantsSchemaReady();

  const supabase = getSupabaseBrowserClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    logSupabaseFailure("createRestaurant.getUser", userError);
    throw new RestaurantCreationError(userError, "auth");
  }

  if (!user?.id) {
    throw new Error("You must be signed in to create a restaurant.");
  }

  await ensureUserProfileReady(supabase, user);

  const { slug: finalSlug, adjusted: slugWasAdjusted } = await resolveUniqueRestaurantSlug(
    supabase,
    input.slug
  );

  const payload = buildRestaurantInsertPayload({
    name: input.name,
    slug: finalSlug,
    userId: user.id,
  });

  const { data, error } = await supabase
    .from("restaurants")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    throw new RestaurantCreationError(
      error ?? {
        message: "Restaurant insert failed without a database response.",
        details: "Supabase did not return the inserted restaurant row.",
        hint: "Verify user_id, slug, and name columns exist on public.restaurants.",
        code: "insert_failed",
      },
      "insert"
    );
  }

  if (input.logo) {
    const { error: logoError } = await supabase
      .from("restaurants")
      .update({ logo_url: input.logo })
      .eq("id", data.id);

    if (logoError) {
      logSupabaseFailure("restaurants.logoUpdate", logoError);
    } else {
      data.logo_url = input.logo;
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
