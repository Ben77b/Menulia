import type { Metadata } from "next";
import { createAnonClient } from "@/lib/supabase";
import { parseContactInfo } from "@/lib/contact-info";
import type { PublicMenuParentCategory, PublicMenuSubcategory } from "@/lib/menu-hierarchy";
import { collectAllDishes } from "@/lib/public-menu-utils";
import { publicMenuPath } from "@/lib/public-menu-url";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://menulia.net";
const MENU_CURRENCY = "EUR";

export interface PublicRestaurantProfile {
  id: string;
  name: string;
  slug: string;
  location: string;
  contact_info: string;
  meta_title: string;
  meta_description: string;
  logo: string | null;
  footer_slogan: string;
}

export async function fetchPublicRestaurantBySlug(
  slug: string
): Promise<PublicRestaurantProfile | null> {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, slug, location, contact_info, meta_title, meta_description, logo, footer_slogan")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;

  return {
    id: data.id as string,
    name: (data.name as string) ?? "",
    slug: (data.slug as string) ?? slug,
    location: (data.location as string) ?? "",
    contact_info: (data.contact_info as string) ?? "",
    meta_title: (data.meta_title as string) ?? "",
    meta_description: (data.meta_description as string) ?? "",
    logo: (data.logo as string | null) ?? null,
    footer_slogan: (data.footer_slogan as string) ?? "",
  };
}

export function buildPublicMenuTitle(restaurantName: string): string {
  return `${restaurantName} Menu | View Dishes, Prices & Order Online`;
}

export function buildPublicMenuDescription(
  restaurantName: string,
  location: string
): string {
  const trimmedLocation = location.trim();
  const locationClause = trimmedLocation ? ` located at ${trimmedLocation}` : "";
  return `Explore the official menu for ${restaurantName}${locationClause}. View our latest categories, prices, ingredients, and dietary options.`;
}

export function buildPublicMenuPageMetadata(
  restaurant: PublicRestaurantProfile
): Metadata {
  const title = buildPublicMenuTitle(restaurant.name);
  const description =
    restaurant.meta_description.trim() ||
    buildPublicMenuDescription(restaurant.name, restaurant.location);
  const canonicalPath = publicMenuPath(restaurant.slug);
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const ogImages = restaurant.logo
    ? [{ url: restaurant.logo, alt: `${restaurant.name} logo` }]
    : undefined;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "menulia.net",
      type: "website",
      locale: "en_US",
      images: ogImages,
    },
    twitter: {
      card: restaurant.logo ? "summary_large_image" : "summary",
      title,
      description,
      images: restaurant.logo ? [restaurant.logo] : undefined,
    },
  };
}

function menuItemJsonLd(dish: {
  name: string;
  description: string;
  price: number;
  image: string | null;
}) {
  const item: Record<string, unknown> = {
    "@type": "MenuItem",
    name: dish.name,
  };

  if (dish.description.trim()) {
    item.description = dish.description.trim();
  }

  if (dish.image) {
    item.image = dish.image;
  }

  if (dish.price > 0) {
    item.offers = {
      "@type": "Offer",
      price: dish.price.toFixed(2),
      priceCurrency: MENU_CURRENCY,
    };
  }

  return item;
}

function menuSectionsJsonLd(
  menu: PublicMenuParentCategory[],
  flatCategories: PublicMenuSubcategory[],
  hasNestedStructure: boolean
): Record<string, unknown>[] {
  if (hasNestedStructure) {
    return menu.flatMap((parent) =>
      parent.subcategories.map((subcategory) => ({
        "@type": "MenuSection",
        name: subcategory.name,
        description: subcategory.description?.trim() || undefined,
        hasMenuItem: subcategory.dishes.map(menuItemJsonLd),
      }))
    );
  }

  return flatCategories.map((category) => ({
    "@type": "MenuSection",
    name: category.name,
    description: category.description?.trim() || undefined,
    hasMenuItem: category.dishes.map(menuItemJsonLd),
  }));
}

export function buildPublicMenuJsonLd({
  restaurant,
  menu,
  flatCategories,
  hasNestedStructure,
}: {
  restaurant: PublicRestaurantProfile;
  menu: PublicMenuParentCategory[];
  flatCategories: PublicMenuSubcategory[];
  hasNestedStructure: boolean;
}): Record<string, unknown> {
  const menuUrl = `${SITE_URL}${publicMenuPath(restaurant.slug)}`;
  const menuId = `${menuUrl}#menu`;
  const { phone, email } = parseContactInfo(restaurant.contact_info);
  const allDishes = collectAllDishes(menu, flatCategories, hasNestedStructure);

  const restaurantNode: Record<string, unknown> = {
    "@type": "Restaurant",
    "@id": `${menuUrl}#restaurant`,
    name: restaurant.name,
    url: menuUrl,
    hasMenu: { "@id": menuId },
  };

  if (restaurant.location.trim()) {
    restaurantNode.address = {
      "@type": "PostalAddress",
      streetAddress: restaurant.location.trim(),
    };
  }

  if (phone) restaurantNode.telephone = phone;
  if (email) restaurantNode.email = email;
  if (restaurant.logo) restaurantNode.image = restaurant.logo;
  if (restaurant.footer_slogan.trim()) {
    restaurantNode.description = restaurant.footer_slogan.trim();
  }

  const menuNode: Record<string, unknown> = {
    "@type": "Menu",
    "@id": menuId,
    name: `${restaurant.name} Menu`,
    url: menuUrl,
    inLanguage: "en",
    hasMenuSection: menuSectionsJsonLd(menu, flatCategories, hasNestedStructure),
  };

  if (allDishes.length > 0) {
    menuNode.hasMenuItem = allDishes.map(menuItemJsonLd);
  }

  return {
    "@context": "https://schema.org",
    "@graph": [restaurantNode, menuNode],
  };
}

export interface RestaurantSitemapEntry {
  slug: string;
  updatedAt: Date;
}

export async function fetchRestaurantSitemapEntries(): Promise<RestaurantSitemapEntry[]> {
  try {
    const supabase = createAnonClient();
    const { data, error } = await supabase
      .from("restaurants")
      .select("slug, updated_at")
      .not("slug", "is", null);

    if (error) {
      console.error("[fetchRestaurantSitemapEntries]", error);
      return [];
    }

    return (data ?? [])
      .filter((row) => typeof row.slug === "string" && row.slug.length > 0)
      .map((row) => ({
        slug: row.slug as string,
        updatedAt: row.updated_at ? new Date(row.updated_at as string) : new Date(),
      }));
  } catch (error) {
    console.error("[fetchRestaurantSitemapEntries]", error);
    return [];
  }
}
