import { getSupabaseBrowserClient } from "./supabase";
import type { Restaurant } from "./types";
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

function normalizeRestaurantRow(row: Record<string, unknown>): Restaurant {
  return {
    ...(row as unknown as Restaurant),
    logo: (row.logo as string | null) ?? (row.logo_url as string | null) ?? null,
  };
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
