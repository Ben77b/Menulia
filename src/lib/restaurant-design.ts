import { contrastingTextColor } from "./contrast";
import { parseDisplayOptions } from "./display-options";
import { parseTypography } from "./typography";
import {
  DEFAULT_MENU_THEME,
  parseMenuThemeColors,
  normalizeHexColor,
  type MenuThemeColors,
} from "./theme-colors";
import { getLocalizedText } from "@/lib/utils/i18n-text";

export interface RestaurantDesign {
  accentColor: string;
  backgroundColor: string;
  cardRadius: "rounded" | "sharp" | "pill";
  headerStyle: "minimal" | "bold";
  menuViewMode: "carousel" | "stacked";
  titleFont: string;
  textFont: string;
  categoryFont: string;
  titleFontWeight: 400 | 700;
  textFontWeight: 400 | 700;
  categoryFontWeight: 400 | 700;
  titleFontStyle: "normal" | "italic";
  textFontStyle: "normal" | "italic";
  categoryFontStyle: "normal" | "italic";
  categoryFontLinkedToTitle: boolean;
  titleColor: string;
  textColor: string;
  priceColor: string;
  logo: string;
  restaurantName: string;
  slogan: string;
  headerColor: string;
  mainColor: string;
  footerColor: string;
  buttonColor: string;
  categoryColor: string;
  categoryTextColor: string;
  location: string;
  hours: string;
  contactInfo: string;
  showFooterLogo: boolean;
  showFooterContact: boolean;
  showFooterHours: boolean;
  showFooterLinks: boolean;
  showFooterTags: boolean;
  metaTitle: string;
  metaDescription: string;
  customFont: string;
  headerBackgroundColor: string;
  categoryStripBackgroundColor: string;
  categoryAccentColor: string;
  mainContentBackgroundColor: string;
  footerBackgroundColor: string;
  showPrices: boolean;
  showDescriptions: boolean;
  showImages: boolean;
  showDietary: boolean;
  /** @deprecated Computed at render time — not persisted */
  headerFooterBackgroundColor: string;
  /** @deprecated Computed at render time — not persisted */
  headerFooterFontColor: string;
  /** @deprecated Computed at render time — not persisted */
  categoryBackgroundColor: string;
  /** @deprecated Computed at render time — not persisted */
  categoryFontColor: string;
  /** @deprecated Computed at render time — not persisted */
  mainContentFontColor: string;
}

export const DEFAULT_DESIGN: RestaurantDesign = {
  accentColor: "#047857",
  backgroundColor: "#fafafa",
  cardRadius: "rounded",
  headerStyle: "minimal",
  menuViewMode: "carousel",
  titleFont: "Inter",
  textFont: "Inter",
  categoryFont: "Inter",
  titleFontWeight: 400,
  textFontWeight: 400,
  categoryFontWeight: 400,
  titleFontStyle: "normal",
  textFontStyle: "normal",
  categoryFontStyle: "normal",
  categoryFontLinkedToTitle: true,
  titleColor: "#000000",
  textColor: "#000000",
  priceColor: "#047857",
  logo: "",
  restaurantName: "",
  slogan: "",
  headerColor: "#ffffff",
  mainColor: "#fafafa",
  footerColor: "#ffffff",
  buttonColor: "#047857",
  categoryColor: "#047857",
  categoryTextColor: "#ffffff",
  location: "",
  hours: "",
  contactInfo: "",
  showFooterLogo: true,
  showFooterContact: true,
  showFooterHours: true,
  showFooterLinks: true,
  showFooterTags: true,
  metaTitle: "",
  metaDescription: "",
  customFont: "",
  headerBackgroundColor: DEFAULT_MENU_THEME.headerBackgroundColor,
  categoryStripBackgroundColor: DEFAULT_MENU_THEME.categoryStripBackgroundColor,
  categoryAccentColor: DEFAULT_MENU_THEME.categoryAccentColor,
  mainContentBackgroundColor: DEFAULT_MENU_THEME.mainContentBackgroundColor,
  footerBackgroundColor: DEFAULT_MENU_THEME.footerBackgroundColor,
  showPrices: true,
  showDescriptions: true,
  showImages: true,
  showDietary: true,
  headerFooterBackgroundColor: "#ffffff",
  headerFooterFontColor: "#000000",
  categoryBackgroundColor: "#f3f4f6",
  categoryFontColor: "#047857",
  mainContentFontColor: "#000000",
};

export function applyComputedContrast(design: RestaurantDesign): RestaurantDesign {
  const headerText = contrastingTextColor(design.headerBackgroundColor);
  const stripText = contrastingTextColor(design.categoryStripBackgroundColor);
  const mainText = contrastingTextColor(design.mainContentBackgroundColor);
  const footerText = contrastingTextColor(design.footerBackgroundColor);
  const accentText = contrastingTextColor(design.categoryAccentColor);

  return {
    ...design,
    headerFooterBackgroundColor: design.headerBackgroundColor,
    headerFooterFontColor: headerText,
    categoryBackgroundColor: design.categoryStripBackgroundColor,
    categoryFontColor: stripText,
    mainContentFontColor: mainText,
    footerColor: design.footerBackgroundColor,
    headerColor: design.headerBackgroundColor,
    mainColor: design.mainContentBackgroundColor,
    accentColor: design.categoryAccentColor,
    buttonColor: design.categoryAccentColor,
    categoryColor: design.categoryAccentColor,
    categoryTextColor: accentText,
    priceColor: mainText,
    titleColor: mainText,
    textColor: mainText,
  };
}

export function designFromRestaurant(row: {
  name?: string;
  logo?: string | null;
  location?: string | null;
  hours?: string | null;
  contact_info?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  theme_colors?: Record<string, string> | null;
  typography?: Record<string, string> | null;
  show_prices?: boolean | null;
  show_descriptions?: boolean | null;
  show_images?: boolean | null;
  show_dietary?: boolean | null;
}): RestaurantDesign {
  const theme = parseMenuThemeColors(row.theme_colors);
  const display = parseDisplayOptions(row);
  const typography = parseTypography(row.typography, {
    titleFont: DEFAULT_DESIGN.titleFont,
    textFont: DEFAULT_DESIGN.textFont,
  });

  return applyComputedContrast({
    ...DEFAULT_DESIGN,
    restaurantName: getLocalizedText(row.name),
    logo: typeof row.logo === "string" ? row.logo : "",
    location: getLocalizedText(row.location),
    hours: getLocalizedText(row.hours),
    contactInfo: typeof row.contact_info === "string" ? row.contact_info : "",
    metaTitle: getLocalizedText(row.meta_title),
    metaDescription: getLocalizedText(row.meta_description),
    headerBackgroundColor: normalizeHexColor(
      theme.headerBackgroundColor,
      DEFAULT_MENU_THEME.headerBackgroundColor
    ),
    categoryStripBackgroundColor: normalizeHexColor(
      theme.categoryStripBackgroundColor,
      DEFAULT_MENU_THEME.categoryStripBackgroundColor
    ),
    categoryAccentColor: normalizeHexColor(
      theme.categoryAccentColor,
      DEFAULT_MENU_THEME.categoryAccentColor
    ),
    mainContentBackgroundColor: normalizeHexColor(
      theme.mainContentBackgroundColor,
      DEFAULT_MENU_THEME.mainContentBackgroundColor
    ),
    footerBackgroundColor: normalizeHexColor(
      theme.footerBackgroundColor,
      DEFAULT_MENU_THEME.footerBackgroundColor
    ),
    titleFont: typography.titleFont,
    textFont: typography.textFont,
    categoryFont: typography.categoryFont,
    titleFontWeight: typography.titleFontWeight,
    textFontWeight: typography.textFontWeight,
    categoryFontWeight: typography.categoryFontWeight,
    titleFontStyle: typography.titleFontStyle,
    textFontStyle: typography.textFontStyle,
    categoryFontStyle: typography.categoryFontStyle,
    categoryFontLinkedToTitle: typography.categoryFontLinkedToTitle,
    showPrices: display.showPrices,
    showDescriptions: display.showDescriptions,
    showImages: display.showImages,
    showDietary: display.showDietary,
  });
}

export function themeColorsFromDesign(design: RestaurantDesign): MenuThemeColors {
  return {
    headerBackgroundColor: design.headerBackgroundColor,
    categoryStripBackgroundColor: design.categoryStripBackgroundColor,
    categoryAccentColor: design.categoryAccentColor,
    mainContentBackgroundColor: design.mainContentBackgroundColor,
    footerBackgroundColor: design.footerBackgroundColor,
  };
}

export function radiusClass(design: RestaurantDesign): string {
  return design.cardRadius === "sharp"
    ? "rounded-lg"
    : design.cardRadius === "pill"
      ? "rounded-3xl"
      : "rounded-2xl";
}
