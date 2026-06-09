import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://menulia.io";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard/", "/onboarding"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
