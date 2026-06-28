import { notFound } from "next/navigation";
import { fetchRestaurantBySlug, fetchAllRestaurantSlugs } from "@/lib/data";
import { DinerApp } from "@/components/public/diner-app";
import { buildPublicMenuDesign, withPublicMenuDefaults } from "@/lib/public-menu";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ "restaurant-slug": string }>;
}

export async function generateStaticParams() {
  try {
    const slugs = await fetchAllRestaurantSlugs();
    return slugs.map((slug) => ({ "restaurant-slug": slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { "restaurant-slug": slug } = await params;
  const restaurant = await fetchRestaurantBySlug(slug);

  if (!restaurant) {
    return { title: "Menu Not Found" };
  }

  const prepared = withPublicMenuDefaults(restaurant);
  const design = buildPublicMenuDesign(prepared);

  return {
    title: design.metaTitle || prepared.name,
    description: design.metaDescription,
  };
}

export default async function PublicMenuPage({ params }: PageProps) {
  const { "restaurant-slug": slug } = await params;
  const restaurant = await fetchRestaurantBySlug(slug);

  if (!restaurant) {
    notFound();
  }

  const prepared = withPublicMenuDefaults({
    ...restaurant,
    categories: restaurant.categories ?? [],
  });
  const design = buildPublicMenuDesign(prepared);

  return <DinerApp restaurant={prepared} design={design} />;
}
