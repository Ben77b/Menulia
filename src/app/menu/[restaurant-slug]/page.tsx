export const dynamic = "force-dynamic";

import { createAnonClient } from "@/lib/supabase";
import { parseMenuThemeColors } from "@/lib/theme-colors";
import { PublicMenuLayout } from "@/components/public/public-menu-layout";
import { PublicMenuDocumentBackground } from "@/components/public/public-menu-document-background";
import { fetchPublicMenuData } from "@/lib/public-menu-fetch";
import { parseCustomLinks } from "@/lib/restaurant-links";
import { parseDisplayOptions } from "@/lib/display-options";
import { DEFAULT_DESIGN } from "@/lib/restaurant-design";

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

function resolveFonts(typography: Record<string, unknown> | null | undefined) {
  const titleFont =
    (typeof typography?.titleFont === "string" && typography.titleFont) || DEFAULT_DESIGN.titleFont;
  const textFont =
    (typeof typography?.textFont === "string" && typography.textFont) || titleFont;
  return { titleFont, textFont };
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

  const { menu, flatCategories, hasNestedStructure } = await fetchPublicMenuData(
    restaurant.id
  );
  const links = parseCustomLinks(restaurant.custom_links);
  const display = parseDisplayOptions(restaurant);
  const theme = parseMenuThemeColors(restaurant.theme_colors);
  const fonts = resolveFonts(
    restaurant.typography && typeof restaurant.typography === "object"
      ? (restaurant.typography as Record<string, unknown>)
      : undefined
  );

  return (
    <>
      <PublicMenuDocumentBackground color={theme.headerBackgroundColor} />
      <PublicMenuLayout
      restaurantName={restaurant.name}
      logo={(restaurant.logo as string | null) ?? null}
      location={(restaurant.location as string | null) ?? ""}
      hours={(restaurant.hours as string | null) ?? ""}
      contactInfo={(restaurant.contact_info as string | null) ?? ""}
      footerSlogan={(restaurant.footer_slogan as string | null) ?? ""}
      theme={theme}
      titleFont={fonts.titleFont}
      bodyFont={fonts.textFont}
      menu={menu}
      flatCategories={flatCategories}
      hasNestedStructure={hasNestedStructure}
      links={links}
      display={display}
    />
    </>
  );
}
