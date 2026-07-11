import { createAnonClient } from "@/lib/supabase";
import { isMissingColumnError } from "@/lib/restaurant-settings";

export type PublicRestaurantProfile = {
  name: string;
  slug: string;
  description: string;
};

function normalizeRows(
  rows: Array<Record<string, unknown>> | null,
  descriptionKey: "description" | "meta_description" = "description"
): PublicRestaurantProfile[] {
  return (rows ?? [])
    .filter((row) => typeof row.slug === "string" && row.slug.length > 0)
    .map((row) => ({
      name: typeof row.name === "string" && row.name.trim() ? row.name : (row.slug as string),
      slug: row.slug as string,
      description:
        typeof row[descriptionKey] === "string" && (row[descriptionKey] as string).trim()
          ? (row[descriptionKey] as string)
          : "",
    }));
}

export async function fetchPublicRestaurantProfiles(): Promise<PublicRestaurantProfile[]> {
  const supabase = createAnonClient();

  const { data: publicRows, error: publicError } = await supabase
    .from("restaurant_profiles")
    .select("name, slug, description, created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (!publicError) {
    return normalizeRows(publicRows);
  }

  if (isMissingColumnError(publicError)) {
    const { data: activeRows, error: activeError } = await supabase
      .from("restaurant_profiles")
      .select("name, slug, description, created_at, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (!activeError) {
      return normalizeRows(activeRows);
    }

    if (isMissingColumnError(activeError)) {
      const { data: profileRows, error: profileError } = await supabase
        .from("restaurant_profiles")
        .select("name, slug, description, created_at")
        .not("slug", "is", null)
        .order("created_at", { ascending: false });

      if (!profileError) {
        return normalizeRows(profileRows);
      }
    }
  }

  const { data: restaurantRows, error: restaurantError } = await supabase
    .from("restaurants")
    .select("name, slug, meta_description, created_at")
    .not("slug", "is", null)
    .order("created_at", { ascending: false });

  if (restaurantError) {
    console.error("[public-restaurants] Failed to fetch profiles", restaurantError);
    return [];
  }

  return normalizeRows(restaurantRows, "meta_description");
}
