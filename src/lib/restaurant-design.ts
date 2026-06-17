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

const STORAGE_KEY = "menulia_restaurant_design";

export function loadDesign(restaurantId: string, useLocalStorage = false): RestaurantDesign {
  if (typeof window === "undefined") return { ...DEFAULT_DESIGN };
  
  const key = `${STORAGE_KEY}_${restaurantId}`;
  
  // If explicitly requesting localStorage (for preview mode)
  if (useLocalStorage) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? { ...DEFAULT_DESIGN, ...JSON.parse(raw) } : { ...DEFAULT_DESIGN };
    } catch {
      return { ...DEFAULT_DESIGN };
    }
  }
  
  // For production, load from restaurant data (will be passed as prop)
  // This function now serves as a fallback for preview mode only
  return { ...DEFAULT_DESIGN };
}

export function saveDesign(restaurantId: string, design: RestaurantDesign) {
  const key = `${STORAGE_KEY}_${restaurantId}`;
  localStorage.setItem(key, JSON.stringify(design));
}

export function radiusClass(design: RestaurantDesign): string {
  return design.cardRadius === "sharp"
    ? "rounded-lg"
    : design.cardRadius === "pill"
      ? "rounded-3xl"
      : "rounded-2xl";
}
