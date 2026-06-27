import { notFound } from "next/navigation";
import { fetchRestaurantBySlug, fetchAllRestaurantSlugs } from "@/lib/data";
import { PublicMenuTemplate } from "@/components/public/public-menu-template";

interface PageProps {
  params: Promise<{ "restaurant-slug": string }>;
}

export async function generateStaticParams() {
  const slugs = await fetchAllRestaurantSlugs();
  return slugs.map((slug) => ({ "restaurant-slug": slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { "restaurant-slug": slug } = await params;
  const restaurant = await fetchRestaurantBySlug(slug);
  if (!restaurant) return { title: "Not Found" };
  return {
    title: restaurant.name,
    description: `View the digital menu for ${restaurant.name}`,
  };
}

export default async function RestaurantPage({ params }: PageProps) {
  const { "restaurant-slug": slug } = await params;
  const restaurant = await fetchRestaurantBySlug(slug);

  if (!restaurant) notFound();

  return <PublicMenuTemplate restaurant={restaurant} />;
}
