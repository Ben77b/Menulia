import { createAnonClient } from "@/lib/supabase";
import { attachMenuCategories } from "@/lib/data";
import { DinerApp } from "@/components/public/diner-app";
import { buildPublicMenuDesign, withPublicMenuDefaults } from "@/lib/public-menu";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ "restaurant-slug": string }>;
}

function MenuAwaitingSync({ slugParam }: { slugParam: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-lg font-medium text-gray-900">
          Menu Route Connected. Awaiting database sync for slug: {slugParam}
        </p>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const slugParam = resolvedParams["restaurant-slug"];

  const supabase = createAnonClient();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("name, meta_title, meta_description")
    .eq("slug", slugParam)
    .single();

  if (!restaurant) {
    return { title: `Menu — ${slugParam}` };
  }

  return {
    title: restaurant.meta_title || restaurant.name,
    description:
      restaurant.meta_description || `View the digital menu for ${restaurant.name}`,
  };
}

export default async function PublicMenuPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slugParam = resolvedParams["restaurant-slug"];

  const supabase = createAnonClient();
  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slugParam)
    .single();

  if (error || !restaurant) {
    return <MenuAwaitingSync slugParam={slugParam} />;
  }

  const fullRestaurant = await attachMenuCategories(restaurant);
  const prepared = withPublicMenuDefaults({
    ...fullRestaurant,
    categories: fullRestaurant.categories ?? [],
  });
  const design = buildPublicMenuDesign(prepared);

  return <DinerApp restaurant={prepared} design={design} />;
}
