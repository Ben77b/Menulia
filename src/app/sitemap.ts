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
  const now = new Date();

  const marketingEntries: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/es`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${base}/testimonials`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${base}/es/testimonials`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
  ];

  const menuEntries = slugs.map((entry) => ({
    url: `${base}/menu/${entry.slug}`,
    lastModified: entry.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [...marketingEntries, ...menuEntries];
}
