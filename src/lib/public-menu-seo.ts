import type { Metadata } from "next";
import { createAnonClient } from "@/lib/supabase";
import { parseContactInfo } from "@/lib/contact-info";
import type { PublicMenuParentCategory, PublicMenuSubcategory } from "@/lib/menu-hierarchy";
import { collectAllDishes } from "@/lib/public-menu-utils";
import { resolveLocalizedText, type LocalizedTextValue } from "@/lib/localized-text";
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
  const { getPublicRestaurantRow, restaurantRowToProfile } = await import(
    "@/lib/public-menu-cache"
  );
  const row = await getPublicRestaurantRow(slug);
  if (!row) return null;
  return restaurantRowToProfile(row, slug);
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
  name: LocalizedTextValue;
  description: LocalizedTextValue;
  price: number;
  hide_price?: boolean;
  image: string | null;
}) {
  const localizedName = resolveLocalizedText(dish.name, "en");
  const localizedDescription = resolveLocalizedText(dish.description, "en");

  const item: Record<string, unknown> = {
    "@type": "MenuItem",
    name: localizedName,
  };

  if (localizedDescription.trim()) {
    item.description = localizedDescription.trim();
  }

  if (dish.image) {
    item.image = dish.image;
  }

  if (!dish.hide_price && dish.price > 0) {
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
        name: resolveLocalizedText(subcategory.name, "en"),
        description: resolveLocalizedText(subcategory.description, "en").trim() || undefined,
        hasMenuItem: subcategory.dishes.map(menuItemJsonLd),
      }))
    );
  }

  return flatCategories.map((category) => ({
    "@type": "MenuSection",
    name: resolveLocalizedText(category.name, "en"),
    description: resolveLocalizedText(category.description, "en").trim() || undefined,
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
