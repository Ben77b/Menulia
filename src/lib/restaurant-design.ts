export interface RestaurantDesign {
  accentColor: string;
  backgroundColor: string;
  cardRadius: "rounded" | "sharp" | "pill";
  headerStyle: "minimal" | "bold";
  menuViewMode: "carousel" | "stacked";
  titleFont: string;
  textFont: string;
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
  headerFooterBackgroundColor: string;
  mainContentBackgroundColor: string;
  categoryBackgroundColor: string;
  headerFooterFontColor: string;
  mainContentFontColor: string;
  categoryFontColor: string;
}

export const DEFAULT_DESIGN: RestaurantDesign = {
  accentColor: "#047857",
  backgroundColor: "#fafafa",
  cardRadius: "rounded",
  headerStyle: "minimal",
  menuViewMode: "carousel",
  titleFont: "Inter",
  textFont: "Inter",
  titleColor: "#1f2937",
  textColor: "#6b7280",
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
  headerFooterBackgroundColor: "#ffffff",
  mainContentBackgroundColor: "#fafafa",
  categoryBackgroundColor: "#047857",
  headerFooterFontColor: "#1f2937",
  mainContentFontColor: "#1f2937",
  categoryFontColor: "#ffffff",
};

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
}): RestaurantDesign {
  const theme = row.theme_colors ?? {};
  const typography = row.typography ?? {};
  const titleFont = typography.titleFont ?? DEFAULT_DESIGN.titleFont;
  const textFont = typography.textFont ?? titleFont;

  return {
    ...DEFAULT_DESIGN,
    restaurantName: row.name ?? "",
    logo: row.logo ?? "",
    location: row.location ?? "",
    hours: row.hours ?? "",
    contactInfo: row.contact_info ?? "",
    metaTitle: row.meta_title ?? "",
    metaDescription: row.meta_description ?? "",
    headerFooterBackgroundColor:
      theme.headerFooterBackgroundColor ?? DEFAULT_DESIGN.headerFooterBackgroundColor,
    categoryBackgroundColor:
      theme.categoryBackgroundColor ?? DEFAULT_DESIGN.categoryBackgroundColor,
    mainContentBackgroundColor:
      theme.mainContentBackgroundColor ?? DEFAULT_DESIGN.mainContentBackgroundColor,
    headerFooterFontColor:
      theme.headerFooterFontColor ?? DEFAULT_DESIGN.headerFooterFontColor,
    categoryFontColor: theme.categoryFontColor ?? DEFAULT_DESIGN.categoryFontColor,
    mainContentFontColor:
      theme.mainContentFontColor ?? DEFAULT_DESIGN.mainContentFontColor,
    titleFont,
    textFont,
  };
}

export function radiusClass(design: RestaurantDesign): string {
  return design.cardRadius === "sharp"
    ? "rounded-lg"
    : design.cardRadius === "pill"
      ? "rounded-3xl"
      : "rounded-2xl";
}
