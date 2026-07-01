import type { MetadataRoute } from "next";
import { fetchRestaurantSitemapEntries } from "@/lib/public-menu-seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://menulia.net";
  const restaurants = await fetchRestaurantSitemapEntries();

  const staticPages = ["", "/onboarding", "/signup", "/login", "/privacy", "/terms"].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const restaurantPages = restaurants.map((entry) => ({
    url: `${base}/menu/${entry.slug}`,
    lastModified: entry.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  return [...staticPages, ...restaurantPages];
}
