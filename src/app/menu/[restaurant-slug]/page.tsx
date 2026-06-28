export const dynamic = "force-dynamic";

import Image from "next/image";
import { createAnonClient } from "@/lib/supabase";
import { DEFAULT_DESIGN } from "@/lib/restaurant-design";
import { formatPrice } from "@/lib/utils";

interface PageProps {
  params: Promise<{ "restaurant-slug": string }>;
}

interface MenuDish {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
}

interface MenuCategory {
  id: string;
  name: string;
  layout_type: string;
  dishes: MenuDish[];
}

function themeColor(theme: Record<string, unknown>, key: string, fallback: string) {
  const value = theme[key];
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function resolveFonts(typography: Record<string, unknown> | null | undefined) {
  const titleFont =
    (typeof typography?.titleFont === "string" && typography.titleFont) || DEFAULT_DESIGN.titleFont;
  const textFont =
    (typeof typography?.textFont === "string" && typography.textFont) || titleFont;
  return { titleFont, textFont };
}

async function fetchMenuCategories(restaurantId: string): Promise<MenuCategory[]> {
  const supabase = createAnonClient();

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name, layout_type, order_index")
    .eq("restaurant_id", restaurantId)
    .order("order_index", { ascending: true });

  if (categoriesError || !categories?.length) {
    return [];
  }

  const results = await Promise.all(
    categories.map(async (category) => {
      const { data: dishes } = await supabase
        .from("dishes")
        .select("id, name, description, price, image")
        .eq("category_id", category.id)
        .order("created_at", { ascending: true });

      return {
        id: category.id,
        name: category.name,
        layout_type: category.layout_type === "carousel" ? "carousel" : "stacked",
        dishes: (dishes ?? []).map((dish) => ({
          id: dish.id,
          name: dish.name,
          description: dish.description || "",
          price: typeof dish.price === "number" ? dish.price : parseFloat(String(dish.price)) || 0,
          image: dish.image ?? null,
        })),
      };
    })
  );

  return results;
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

  const categories = await fetchMenuCategories(restaurant.id);
  const theme =
    restaurant.theme_colors && typeof restaurant.theme_colors === "object"
      ? (restaurant.theme_colors as Record<string, unknown>)
      : {};
  const fonts = resolveFonts(
    restaurant.typography && typeof restaurant.typography === "object"
      ? (restaurant.typography as Record<string, unknown>)
      : undefined
  );

  const headerBg = themeColor(theme, "headerFooterBackgroundColor", DEFAULT_DESIGN.headerFooterBackgroundColor);
  const categoryBg = themeColor(theme, "categoryBackgroundColor", DEFAULT_DESIGN.categoryBackgroundColor);
  const mainBg = themeColor(theme, "mainContentBackgroundColor", DEFAULT_DESIGN.mainContentBackgroundColor);
  const headerFontColor = themeColor(theme, "headerFooterFontColor", DEFAULT_DESIGN.headerFooterFontColor);
  const categoryFontColor = themeColor(theme, "categoryFontColor", DEFAULT_DESIGN.categoryFontColor);
  const mainFontColor = themeColor(theme, "mainContentFontColor", DEFAULT_DESIGN.mainContentFontColor);

  const logo = (restaurant.logo as string | null) ?? null;
  const location = (restaurant.location as string | null) ?? "";
  const hours = (restaurant.hours as string | null) ?? "";
  const contactInfo = (restaurant.contact_info as string | null) ?? "";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: mainBg, fontFamily: fonts.textFont }}>
      <header
        className="sticky top-0 z-50 border-b border-black/5 px-4 py-4 text-center"
        style={{ backgroundColor: headerBg, color: headerFontColor }}
      >
        {logo ? (
          <div className="relative mx-auto h-20 w-20">
            <Image src={logo} alt={restaurant.name} fill className="object-contain" sizes="80px" />
          </div>
        ) : (
          <h1 className="text-xl font-bold" style={{ fontFamily: fonts.titleFont }}>
            {restaurant.name}
          </h1>
        )}
      </header>

      {categories.length > 0 && (
        <nav
          className="sticky top-[88px] z-40 flex gap-2 overflow-x-auto border-b border-black/5 px-4 py-3"
          style={{ backgroundColor: categoryBg, color: categoryFontColor }}
        >
          {categories.map((category) => (
            <a
              key={category.id}
              href={`#category-${category.id}`}
              className="whitespace-nowrap rounded-full bg-white/90 px-4 py-2 text-sm font-medium shadow-sm"
              style={{ color: categoryFontColor }}
            >
              {category.name}
            </a>
          ))}
        </nav>
      )}

      <main className="flex-1 px-4 py-6">
        {categories.length === 0 ? (
          <div
            className="rounded-2xl border border-dashed border-gray-300 px-6 py-12 text-center"
            style={{ color: mainFontColor }}
          >
            <p className="text-lg font-semibold" style={{ fontFamily: fonts.titleFont }}>
              Menu coming soon!
            </p>
            <p className="mt-2 text-sm">This restaurant hasn&apos;t added any dishes yet.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {categories.map((category) => (
              <section
                key={category.id}
                id={`category-${category.id}`}
                className="scroll-mt-36"
              >
                <h2
                  className="mb-4 text-2xl font-bold"
                  style={{ color: mainFontColor, fontFamily: fonts.titleFont }}
                >
                  {category.name}
                </h2>

                {category.layout_type === "carousel" ? (
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {category.dishes.map((dish) => (
                      <article
                        key={dish.id}
                        className="min-w-[260px] shrink-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                      >
                        {dish.image && (
                          <div className="relative mb-3 h-40 w-full overflow-hidden rounded-xl">
                            <Image
                              src={dish.image}
                              alt={dish.name}
                              fill
                              className="object-cover"
                              sizes="260px"
                            />
                          </div>
                        )}
                        <h3
                          className="font-semibold"
                          style={{ color: mainFontColor, fontFamily: fonts.titleFont }}
                        >
                          {dish.name}
                        </h3>
                        {dish.description && (
                          <p className="mt-1 text-sm line-clamp-3" style={{ color: mainFontColor }}>
                            {dish.description}
                          </p>
                        )}
                        <p className="mt-3 font-bold" style={{ color: categoryBg }}>
                          {formatPrice(dish.price)}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {category.dishes.map((dish) => (
                      <article
                        key={dish.id}
                        className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex gap-4">
                          {dish.image && (
                            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
                              <Image
                                src={dish.image}
                                alt={dish.name}
                                fill
                                className="object-cover"
                                sizes="96px"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3
                              className="font-semibold"
                              style={{ color: mainFontColor, fontFamily: fonts.titleFont }}
                            >
                              {dish.name}
                            </h3>
                            {dish.description && (
                              <p className="mt-1 text-sm" style={{ color: mainFontColor }}>
                                {dish.description}
                              </p>
                            )}
                            <p className="mt-2 font-bold" style={{ color: categoryBg }}>
                              {formatPrice(dish.price)}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </main>

      {(location || hours || contactInfo) && (
        <footer
          className="border-t border-black/5 px-6 py-10"
          style={{ backgroundColor: headerBg, color: headerFontColor }}
        >
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
            {location && (
              <div className="text-center">
                <h3 className="mb-2 font-bold" style={{ fontFamily: fonts.titleFont }}>
                  Location
                </h3>
                <p className="text-sm">{location}</p>
              </div>
            )}
            {hours && (
              <div className="text-center">
                <h3 className="mb-2 font-bold" style={{ fontFamily: fonts.titleFont }}>
                  Hours
                </h3>
                <p className="whitespace-pre-line text-sm">{hours}</p>
              </div>
            )}
            {contactInfo && (
              <div className="text-center">
                <h3 className="mb-2 font-bold" style={{ fontFamily: fonts.titleFont }}>
                  Contact
                </h3>
                <p className="text-sm">{contactInfo}</p>
              </div>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
