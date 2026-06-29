import type { MetadataRoute } from "next";
import { fetchAllRestaurantSlugs } from "@/lib/data";
import { getAllBlogSlugs } from "@/lib/marketing/blog-posts";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://menulia.net";
  const slugs = await fetchAllRestaurantSlugs();

  const staticPages = ["", "/about", "/pricing", "/services", "/contact", "/blog", "/onboarding"].map(
    (path) => ({
      url: `${base}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    })
  );

  const blogPages = getAllBlogSlugs().map((slug) => ({
    url: `${base}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const restaurantPages = slugs.map((slug) => ({
    url: `${base}/menu/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  return [...staticPages, ...blogPages, ...restaurantPages];
}
