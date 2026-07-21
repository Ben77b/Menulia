import type { Metadata } from "next";
import { createAnonClient } from "@/lib/supabase";
import { parseContactInfo } from "@/lib/contact-info";
import type { PublicMenuParentCategory, PublicMenuSubcategory } from "@/lib/menu-hierarchy";
import { collectAllDishes } from "@/lib/public-menu-utils";
import type { LocalizedTextValue } from "@/lib/localized-text";
import { getLocalizedText, truncateSeoText } from "@/lib/utils/i18n-text";
import { publicMenuPath } from "@/lib/public-menu-url";
import {
  MENU_CONTENT_LANGUAGES,
  isMenuContentLanguage,
  type MenuContentLanguage,
} from "@/lib/menu-content-languages";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://menulia.net";
const MENU_CURRENCY = "EUR";

const OG_LOCALES: Record<MenuContentLanguage, string> = {
  en: "en_US",
  es: "es_ES",
  fr: "fr_FR",
  de: "de_DE",
};

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

function cleanRestaurantName(name: unknown, lang: string): string {
  return getLocalizedText(name, lang) || "Restaurant";
}

function cleanLocation(location: unknown, lang: string): string {
  return getLocalizedText(location, lang);
}

export function buildPublicMenuTitle(
  restaurantName: string,
  location = "",
  lang = "en"
): string {
  const name = cleanRestaurantName(restaurantName, lang);
  const city = cleanLocation(location, lang);
  if (city) return `${name} | Menu & Prices - ${city}`;
  return `${name} | Menu & Prices`;
}

export function buildPublicMenuDescription(
  restaurantName: string,
  location: string,
  metaDescription?: string,
  lang = "en"
): string {
  const custom = getLocalizedText(metaDescription, lang);
  if (custom) return truncateSeoText(custom, 160);

  const name = cleanRestaurantName(restaurantName, lang);
  const city = cleanLocation(location, lang);
  const locationClause = city ? ` in ${city}` : "";
  return truncateSeoText(
    `Explore the official menu for ${name}${locationClause}. View signature dishes, prices, ingredients, and dietary options.`,
    160
  );
}

function menuAbsoluteUrl(slug: string, lang?: string | null): string {
  const base = `${SITE_URL}${publicMenuPath(slug)}`;
  if (!lang) return base;
  return `${base}?lang=${encodeURIComponent(lang)}`;
}

function buildHreflangLanguages(slug: string): Record<string, string> {
  const languages: Record<string, string> = {
    "x-default": menuAbsoluteUrl(slug),
  };
  for (const { code } of MENU_CONTENT_LANGUAGES) {
    languages[code] = menuAbsoluteUrl(slug, code);
  }
  return languages;
}

export function normalizePublicMenuLang(value: unknown): MenuContentLanguage {
  return isMenuContentLanguage(value) ? value : "en";
}

export function buildPublicMenuPageMetadata(
  restaurant: PublicRestaurantProfile,
  lang: MenuContentLanguage = "en"
): Metadata {
  const name = cleanRestaurantName(restaurant.name, lang);
  const title =
    getLocalizedText(restaurant.meta_title, lang) ||
    buildPublicMenuTitle(restaurant.name, restaurant.location, lang);
  const description = buildPublicMenuDescription(
    restaurant.name,
    restaurant.location,
    restaurant.meta_description || restaurant.footer_slogan,
    lang
  );
  const canonicalUrl = menuAbsoluteUrl(restaurant.slug, lang);
  const ogImages = restaurant.logo
    ? [{ url: restaurant.logo, alt: `${name} logo` }]
    : undefined;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: buildHreflangLanguages(restaurant.slug),
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Menulia",
      locale: OG_LOCALES[lang],
      alternateLocale: MENU_CONTENT_LANGUAGES.filter((item) => item.code !== lang).map(
        (item) => OG_LOCALES[item.code]
      ),
      images: ogImages,
      // Open Graph restaurant menu type for rich social previews
      type: "restaurant.menu" as "website",
    },
    twitter: {
      card: restaurant.logo ? "summary_large_image" : "summary",
      title,
      description,
      images: restaurant.logo ? [restaurant.logo] : undefined,
    },
  };
}

const DIET_SCHEMA: Array<{ match: RegExp; uri: string }> = [
  { match: /\bvegan\b/i, uri: "https://schema.org/VeganDiet" },
  { match: /\bvegetarian\b|\bveggie\b/i, uri: "https://schema.org/VegetarianDiet" },
  { match: /\bgluten[\s-]?free\b|\bsin\s+gluten\b/i, uri: "https://schema.org/GlutenFreeDiet" },
  { match: /\bhalal\b/i, uri: "https://schema.org/HalalDiet" },
  { match: /\bkosher\b/i, uri: "https://schema.org/KosherDiet" },
];

function tagLabel(raw: string): string {
  const parts = raw.split("|");
  return (parts[parts.length - 1] ?? raw).trim();
}

function mapSuitableForDiet(tags: string[] | null | undefined): string[] {
  const uris = new Set<string>();
  for (const raw of tags ?? []) {
    if (!raw) continue;
    const label = tagLabel(raw);
    for (const rule of DIET_SCHEMA) {
      if (rule.match.test(label)) uris.add(rule.uri);
    }
  }
  return [...uris];
}

type JsonLdDish = {
  name: LocalizedTextValue;
  description: LocalizedTextValue;
  price: number;
  hide_price?: boolean;
  image: string | null;
  tags?: string[] | null;
};

function menuItemJsonLd(dish: JsonLdDish, lang: string) {
  const localizedName = getLocalizedText(dish.name, lang);
  const localizedDescription = getLocalizedText(dish.description, lang);
  const diets = mapSuitableForDiet(dish.tags);

  const item: Record<string, unknown> = {
    "@type": "MenuItem",
    name: localizedName,
  };

  if (localizedDescription) {
    item.description = localizedDescription;
  }

  if (dish.image) {
    item.image = dish.image;
  }

  if (!dish.hide_price && Number(dish.price) > 0) {
    const price = Number(dish.price).toFixed(2);
    item.offers = {
      "@type": "Offer",
      price,
      priceCurrency: MENU_CURRENCY,
    };
  }

  if (diets.length > 0) {
    item.suitableForDiet = diets;
  }

  return item;
}

function menuSectionsJsonLd(
  menu: PublicMenuParentCategory[],
  flatCategories: PublicMenuSubcategory[],
  hasNestedStructure: boolean,
  lang: string
): Record<string, unknown>[] {
  if (hasNestedStructure) {
    return (menu ?? []).flatMap((parent) =>
      (parent?.subcategories ?? []).map((subcategory) => ({
        "@type": "MenuSection",
        name: getLocalizedText(subcategory?.name ?? "", lang),
        description:
          getLocalizedText(subcategory?.description ?? "", lang) || undefined,
        hasMenuItem: (subcategory?.dishes ?? [])
          .filter(Boolean)
          .map((dish) => menuItemJsonLd(dish, lang)),
      }))
    );
  }

  return (flatCategories ?? []).map((category) => ({
    "@type": "MenuSection",
    name: getLocalizedText(category?.name ?? "", lang),
    description: getLocalizedText(category?.description ?? "", lang) || undefined,
    hasMenuItem: (category?.dishes ?? [])
      .filter(Boolean)
      .map((dish) => menuItemJsonLd(dish, lang)),
  }));
}

export function buildPublicMenuJsonLd({
  restaurant,
  menu,
  flatCategories,
  hasNestedStructure,
  lang = "en",
}: {
  restaurant: PublicRestaurantProfile;
  menu: PublicMenuParentCategory[];
  flatCategories: PublicMenuSubcategory[];
  hasNestedStructure: boolean;
  lang?: string;
}): Record<string, unknown> {
  const menuUrl = menuAbsoluteUrl(restaurant.slug, lang);
  const menuId = `${SITE_URL}${publicMenuPath(restaurant.slug)}#menu`;
  const { phone, email } = parseContactInfo(restaurant.contact_info);
  const allDishes = collectAllDishes(menu, flatCategories, hasNestedStructure);
  const name = cleanRestaurantName(restaurant.name, lang);
  const description =
    getLocalizedText(restaurant.meta_description, lang) ||
    getLocalizedText(restaurant.footer_slogan, lang);
  const location = cleanLocation(restaurant.location, lang);

  const restaurantNode: Record<string, unknown> = {
    "@type": ["Restaurant", "FoodEstablishment"],
    "@id": `${SITE_URL}${publicMenuPath(restaurant.slug)}#restaurant`,
    name,
    url: menuUrl,
    hasMenu: { "@id": menuId },
  };

  if (location) {
    restaurantNode.address = {
      "@type": "PostalAddress",
      streetAddress: location,
    };
  }

  if (phone) restaurantNode.telephone = phone;
  if (email) restaurantNode.email = email;
  if (restaurant.logo) restaurantNode.image = restaurant.logo;
  if (description) restaurantNode.description = description;

  const menuNode: Record<string, unknown> = {
    "@type": "Menu",
    "@id": menuId,
    name: `${name} Menu`,
    url: menuUrl,
    inLanguage: lang,
    hasMenuSection: menuSectionsJsonLd(menu, flatCategories, hasNestedStructure, lang),
  };

  if (allDishes.length > 0) {
    menuNode.hasMenuItem = allDishes.map((dish) => menuItemJsonLd(dish, lang));
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
