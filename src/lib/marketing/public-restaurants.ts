import { createAnonClient } from "@/lib/supabase";
import { isMissingColumnError } from "@/lib/restaurant-settings";
import { getLocalizedText } from "@/lib/utils/i18n-text";

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
    .map((row) => {
      const slug = row.slug as string;
      return {
        name: getLocalizedText(row.name) || slug,
        slug,
        description: getLocalizedText(row[descriptionKey]),
      };
    });
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
