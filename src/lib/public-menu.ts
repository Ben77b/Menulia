import type { CustomLink, OperatingHourData, RestaurantFull } from "./types";
import { DEFAULT_DESIGN, type RestaurantDesign } from "./restaurant-design";

export const DEFAULT_OPERATING_HOURS: OperatingHourData[] = [
  { day: "Monday", isOpen: true, startTime: "12:00", endTime: "22:00" },
  { day: "Tuesday", isOpen: true, startTime: "12:00", endTime: "22:00" },
  { day: "Wednesday", isOpen: true, startTime: "12:00", endTime: "22:00" },
  { day: "Thursday", isOpen: true, startTime: "12:00", endTime: "22:00" },
  { day: "Friday", isOpen: true, startTime: "12:00", endTime: "22:00" },
  { day: "Saturday", isOpen: true, startTime: "12:00", endTime: "22:00" },
  { day: "Sunday", isOpen: true, startTime: "12:00", endTime: "22:00" },
];

export const DEFAULT_FOOTER_NOTE =
  "We look forward to serving you. Please inform your server of any allergies.";

function normalizeCustomLinks(restaurant: RestaurantFull): CustomLink[] {
  const links: CustomLink[] = [];

  if (Array.isArray(restaurant.custom_links) && restaurant.custom_links.length > 0) {
    links.push(...restaurant.custom_links);
  }

  const external = restaurant.external_links;
  if (external && typeof external === "object") {
    const record = external as Record<string, string>;
    if (record.instagram && !links.some((l) => l.url === record.instagram)) {
      links.push({ id: "instagram", label: "Instagram", url: record.instagram });
    }
    if (record.facebook && !links.some((l) => l.url === record.facebook)) {
      links.push({ id: "facebook", label: "Facebook", url: record.facebook });
    }
    if (record.website && !links.some((l) => l.url === record.website)) {
      links.push({ id: "website", label: "Website", url: record.website });
    }
  }

  if (restaurant.instagram_url) {
    links.push({ id: "instagram-direct", label: "Instagram", url: restaurant.instagram_url });
  }
  if (restaurant.facebook_url) {
    links.push({ id: "facebook-direct", label: "Facebook", url: restaurant.facebook_url });
  }
  if (restaurant.website_url) {
    links.push({ id: "website-direct", label: "Website", url: restaurant.website_url });
  }

  return links;
}

function resolveFontFamily(restaurant: RestaurantFull): { titleFont: string; textFont: string } {
  const typography = restaurant.typography;
  const heading =
    (typeof typography?.customHeadingFont === "string" && typography.customHeadingFont) ||
    restaurant.font_pack_id ||
    "Inter";
  const body =
    (typeof typography?.customBodyFont === "string" && typography.customBodyFont) ||
    heading;

  return { titleFont: heading, textFont: body };
}

export function withPublicMenuDefaults(restaurant: RestaurantFull): RestaurantFull {
  const operating_hours =
    Array.isArray(restaurant.operating_hours) && restaurant.operating_hours.length > 0
      ? restaurant.operating_hours
      : DEFAULT_OPERATING_HOURS;

  const categories = (restaurant.categories ?? []).map((category) => ({
    ...category,
    layout_type: category.layout_type === "carousel" ? "carousel" : "stacked",
    items: (category.items ?? []).map((item) => ({
      ...item,
      description: item.description || "",
      tags: item.tags ?? [],
      allergens: item.allergens ?? [],
      is_available: item.is_available !== false,
    })),
  }));

  return {
    ...restaurant,
    logo: restaurant.logo ?? null,
    custom_links: normalizeCustomLinks(restaurant),
    operating_hours,
    footer_slogan: restaurant.footer_slogan || DEFAULT_FOOTER_NOTE,
    categories,
    phone: restaurant.phone ?? restaurant.contact_email ?? null,
    email: restaurant.email ?? restaurant.contact_email ?? null,
  };
}

export function buildPublicMenuDesign(restaurant: RestaurantFull): RestaurantDesign {
  const theme =
    restaurant.theme_colors && typeof restaurant.theme_colors === "object"
      ? (restaurant.theme_colors as Record<string, string | boolean>)
      : {};

  const fonts = resolveFontFamily(restaurant);
  const accent =
    (typeof theme.color3 === "string" && theme.color3) ||
    DEFAULT_DESIGN.buttonColor;
  const headerBg =
    (typeof theme.color2 === "string" && theme.color2) ||
    DEFAULT_DESIGN.headerFooterBackgroundColor;
  const mainBg =
    (typeof theme.color1 === "string" && theme.color1) ||
    DEFAULT_DESIGN.mainContentBackgroundColor;

  return {
    ...DEFAULT_DESIGN,
    accentColor: accent,
    backgroundColor: mainBg,
    buttonColor: accent,
    categoryColor: accent,
    priceColor: accent,
    titleColor: DEFAULT_DESIGN.mainContentFontColor,
    textColor: DEFAULT_DESIGN.mainContentFontColor,
    headerFooterBackgroundColor: headerBg,
    mainContentBackgroundColor: mainBg,
    categoryBackgroundColor: headerBg,
    headerFooterFontColor: DEFAULT_DESIGN.headerFooterFontColor,
    mainContentFontColor: DEFAULT_DESIGN.mainContentFontColor,
    categoryFontColor: DEFAULT_DESIGN.categoryFontColor,
    logo: restaurant.logo ?? "",
    restaurantName: restaurant.name,
    slogan: restaurant.footer_slogan ?? "",
    titleFont: fonts.titleFont,
    textFont: fonts.textFont,
    hours: "Mon – Sun: 12:00 PM – 10:00 PM",
    showFooterLogo: true,
    showFooterContact: true,
    showFooterHours: true,
    showFooterLinks: true,
    showFooterTags: true,
    metaTitle: restaurant.name,
    metaDescription: `View the digital menu for ${restaurant.name}`,
  };
}
