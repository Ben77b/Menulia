import type { CustomLink, RestaurantFull } from "./types";
import type { OperatingHourData } from "./operating-hours";
import { defaultOperatingHours, formatOperatingHoursDisplay, normalizeOperatingHours } from "./operating-hours";
import { DEFAULT_DESIGN, applyComputedContrast, type RestaurantDesign } from "./restaurant-design";
import { parseMenuThemeColors } from "./theme-colors";
import { contrastingTextColor } from "./contrast";
import { normalizeCategoryLayoutType } from "./category-layout";

export const DEFAULT_OPERATING_HOURS: OperatingHourData[] = defaultOperatingHours();

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
  const titleFont =
    (typeof typography?.titleFont === "string" && typography.titleFont) ||
    (typeof typography?.customHeadingFont === "string" && typography.customHeadingFont) ||
    restaurant.font_pack_id ||
    "Inter";
  const textFont =
    (typeof typography?.textFont === "string" && typography.textFont) || titleFont;

  return { titleFont, textFont };
}

export function withPublicMenuDefaults(restaurant: RestaurantFull): RestaurantFull {
  const operating_hours = normalizeOperatingHours(restaurant.operating_hours);
  const formattedHours =
    restaurant.hours?.trim() || formatOperatingHoursDisplay(operating_hours);

  const categories = (restaurant.categories ?? []).map((category) => ({
    ...category,
    layout_type: normalizeCategoryLayoutType(category.layout_type),
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
    hours: formattedHours,
    footer_slogan: restaurant.footer_slogan || DEFAULT_FOOTER_NOTE,
    categories,
    phone: restaurant.phone ?? restaurant.contact_email ?? null,
    email: restaurant.email ?? restaurant.contact_email ?? null,
  };
}

export function buildPublicMenuDesign(restaurant: RestaurantFull): RestaurantDesign {
  const operating_hours = normalizeOperatingHours(restaurant.operating_hours);
  const formattedHours =
    restaurant.hours?.trim() || formatOperatingHoursDisplay(operating_hours);

  const theme = parseMenuThemeColors(restaurant.theme_colors);

  const fonts = resolveFontFamily(restaurant);
  const mainText = contrastingTextColor(theme.mainContentBackgroundColor);

  return applyComputedContrast({
    ...DEFAULT_DESIGN,
    accentColor: theme.categoryAccentColor,
    backgroundColor: theme.mainContentBackgroundColor,
    buttonColor: theme.categoryAccentColor,
    categoryColor: theme.categoryAccentColor,
    priceColor: theme.categoryAccentColor,
    titleColor: mainText,
    textColor: mainText,
    headerBackgroundColor: theme.headerBackgroundColor,
    categoryStripBackgroundColor: theme.categoryStripBackgroundColor,
    categoryAccentColor: theme.categoryAccentColor,
    mainContentBackgroundColor: theme.mainContentBackgroundColor,
    footerBackgroundColor: theme.footerBackgroundColor,
    logo: restaurant.logo ?? "",
    restaurantName: restaurant.name,
    slogan: restaurant.footer_slogan ?? "",
    location: restaurant.location ?? "",
    hours: formattedHours,
    contactInfo: restaurant.contact_info ?? "",
    titleFont: fonts.titleFont,
    textFont: fonts.textFont,
    showFooterLogo: true,
    showFooterContact: true,
    showFooterHours: true,
    showFooterLinks: true,
    showFooterTags: true,
    metaTitle: restaurant.meta_title || restaurant.name,
    metaDescription:
      restaurant.meta_description || `View the digital menu for ${restaurant.name}`,
  });
}
