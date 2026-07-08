import type { MetadataRoute } from "next";
import { createAnonClient } from "@/lib/supabase";
import { isMissingColumnError } from "@/lib/restaurant-settings";

export const dynamic = "force-dynamic";

interface SitemapSlugRow {
  slug: string;
  updatedAt: Date;
}

async function fetchActiveRestaurantSlugs(): Promise<SitemapSlugRow[]> {
  const supabase = createAnonClient();

  // Preferred source requested for sitemap indexing.
  const { data: profileRows, error: profileError } = await supabase
    .from("restaurant_profiles")
    .select("slug, updated_at, is_active")
    .eq("is_active", true)
    .not("slug", "is", null);

  if (!profileError) {
    return (profileRows ?? [])
      .filter((row) => typeof row.slug === "string" && row.slug.length > 0)
      .map((row) => ({
        slug: row.slug as string,
        updatedAt: row.updated_at ? new Date(row.updated_at as string) : new Date(),
      }));
  }

  // Handle a profile table that doesn't yet expose `is_active`.
  if (isMissingColumnError(profileError)) {
    const { data: profileRowsNoStatus, error: profileNoStatusError } = await supabase
      .from("restaurant_profiles")
      .select("slug, updated_at")
      .not("slug", "is", null);

    if (!profileNoStatusError) {
      return (profileRowsNoStatus ?? [])
        .filter((row) => typeof row.slug === "string" && row.slug.length > 0)
        .map((row) => ({
          slug: row.slug as string,
          updatedAt: row.updated_at ? new Date(row.updated_at as string) : new Date(),
        }));
    }
  }

  // Backward-compatible fallback for deployments without restaurant_profiles.
  const { data: restaurantRows, error: restaurantError } = await supabase
    .from("restaurants")
    .select("slug, updated_at")
    .not("slug", "is", null);

  if (restaurantError) {
    console.error("[sitemap] Failed to fetch slugs", restaurantError);
    return [];
  }

  return (restaurantRows ?? [])
    .filter((row) => typeof row.slug === "string" && row.slug.length > 0)
    .map((row) => ({
      slug: row.slug as string,
      updatedAt: row.updated_at ? new Date(row.updated_at as string) : new Date(),
    }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.menulia.net";
  const slugs = await fetchActiveRestaurantSlugs();

  const homepageEntry: MetadataRoute.Sitemap[number] = {
    url: base,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1,
  };

  const menuEntries = slugs.map((entry) => ({
    url: `${base}/menu/${entry.slug}`,
    lastModified: entry.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [homepageEntry, ...menuEntries];
}
