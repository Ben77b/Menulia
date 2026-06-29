import type { MetadataRoute } from "next";
import { fetchAllRestaurantSlugs } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://menulia.net";
  const slugs = await fetchAllRestaurantSlugs();

  const staticPages = ["", "/onboarding", "/signup", "/login"].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const restaurantPages = slugs.map((slug) => ({
    url: `${base}/menu/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  return [...staticPages, ...restaurantPages];
}
