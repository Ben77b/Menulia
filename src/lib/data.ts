import { createAnonClient, getSupabaseBrowserClient } from "./supabase";
import type { MenuItemWithTranslations, Restaurant, RestaurantFull } from "./types";
import type { PostgrestError } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

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

function logSupabaseError(scope: string, error: PostgrestError | Error | unknown) {
  if (error && typeof error === "object") {
    const supabaseError = error as PostgrestError;
    console.error(`[createRestaurant:${scope}]`, {
      message: supabaseError.message,
      details: supabaseError.details,
      hint: supabaseError.hint,
      code: supabaseError.code,
    });
    return;
  }

  console.error(`[createRestaurant:${scope}]`, error);
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
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data || []).map((row) => normalizeRestaurantRow(row));
  } catch (error) {
    console.error("Error fetching all restaurants:", error);
    return [];
  }
}

export async function fetchRestaurantsForAuthenticatedUser(): Promise<Restaurant[]> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) throw error;
  if (!session?.user) return [];

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

async function getAuthenticatedUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    logSupabaseError("auth.getUser", userError);
    throw new Error(userError.message || "Authentication failed. Please log in again.");
  }

  if (!user?.id) {
    throw new Error("You must be signed in to create a restaurant.");
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    logSupabaseError("auth.getSession", sessionError);
    throw new Error(sessionError.message || "Unable to verify your session.");
  }

  if (!session?.access_token) {
    throw new Error("Your session expired. Please log in again.");
  }

  return user;
}

async function ensureUserProfile(
  supabase: SupabaseClient,
  user: { id: string; email?: string | null }
) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? "",
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  if (!error) return;

  if (error.code === "42P01" || error.code === "42703") {
    return;
  }

  logSupabaseError("profiles.upsert", error);
}

async function isSlugTaken(supabase: SupabaseClient, slug: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    logSupabaseError("slugCheck", error);
    throw new Error(error.message || "Unable to verify slug availability.");
  }

  return Boolean(data);
}

function randomSlugSuffix(): string {
  return String(Math.floor(100 + Math.random() * 900));
}

async function resolveUniqueSlug(
  supabase: SupabaseClient,
  requestedSlug: string
): Promise<{ slug: string; adjusted: boolean }> {
  const normalized = requestedSlug.trim().toLowerCase().replace(/-+/g, "-").replace(/^-|-$/g, "");

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

  const fallback = `${normalized}-${Date.now().toString().slice(-6)}`;
  return { slug: fallback, adjusted: true };
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
    name,
    slug,
  };

  const payloadAttempts: Record<string, unknown>[] = [];

  if (logo) {
    payloadAttempts.push({ ...basePayload, logo });
    payloadAttempts.push({ ...basePayload, logo_url: logo });
  }

  payloadAttempts.push(basePayload);

  let lastError: PostgrestError | null = null;

  for (const payload of payloadAttempts) {
    const { data, error } = await supabase
      .from("restaurants")
      .insert(payload)
      .select("*")
      .single();

    if (!error && data) {
      return normalizeRestaurantRow(data);
    }

    lastError = error;
    logSupabaseError("insert", error);

    if (error?.code !== "42703") {
      break;
    }
  }

  throw new Error(
    lastError?.message ||
      lastError?.details ||
      "Failed to create restaurant. Please try again."
  );
}

export async function createRestaurant(input: CreateRestaurantInput): Promise<CreateRestaurantResult> {
  const supabase = getSupabaseBrowserClient();

  try {
    const user = await getAuthenticatedUser(supabase);
    await ensureUserProfile(supabase, user);

    const { slug: finalSlug, adjusted: slugWasAdjusted } = await resolveUniqueSlug(
      supabase,
      input.slug
    );

    const restaurant = await insertRestaurantRecord(
      supabase,
      user.id,
      input.name.trim(),
      finalSlug,
      input.logo
    );

    return {
      restaurant,
      finalSlug,
      slugWasAdjusted,
    };
  } catch (error) {
    if (!(error instanceof Error)) {
      logSupabaseError("unknown", error);
      throw new Error("Failed to create restaurant.");
    }

    throw error;
  }
}

export async function waitForRestaurantInList(
  refreshRestaurants: () => Promise<Array<{ id: string }>>,
  restaurantId: string,
  maxAttempts = 8,
  delayMs = 200
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
    logSupabaseError("logoUpload", uploadError);
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
