import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ "restaurant-slug": string }>;
}

export default async function LegacyRestaurantMenuRedirect({ params }: PageProps) {
  const { "restaurant-slug": slug } = await params;
  redirect(`/menu/${slug}`);
}
