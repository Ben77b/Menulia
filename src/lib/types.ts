export type ExpenseCategory = "Staff" | "Inventory" | "Rent" | "Utilities" | "Marketing";
import type { LanguageCode } from "./languages";
import type { RestaurantDesign } from "./restaurant-design";
export type { LanguageCode };

export interface Profile {
  id: string;
  email: string;
  created_at: string;
}

export interface Restaurant {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  logo: string | null;
  banner_url: string | null;
  phone: string | null;
  contact_email: string | null;
  address: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  website_url: string | null;
  whatsapp_url: string | null;
  is_premium: boolean;
  theme_colors: any;
  typography: any;
  external_links: any;
  footer_slogan: string | null;
  custom_links: CustomLink[];
  operating_hours: OperatingHourData[];
  font_pack_id: string;
  location: string | null;
  hours: string | null;
  contact_info: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomLink {
  id: string;
  label: string;
  url: string;
}

export interface OperatingHourData {
  day: string;
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  allergens: string[];
  is_available: boolean;
  tags: string[];
}

export interface MenuTranslation {
  id: string;
  item_id: string;
  language_code: LanguageCode;
  translated_name: string;
  translated_description: string;
}

export interface PageView {
  id: string;
  restaurant_id: string;
  viewed_at: string;
}

export type ReservationStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Reservation {
  id: string;
  restaurant_id: string;
  guest_name: string;
  guest_email: string | null;
  party_size: number;
  reserved_at: string;
  status: ReservationStatus;
  created_at: string;
}

export interface BusinessExpense {
  id: string;
  restaurant_id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  expense_date: string;
}

export interface RestaurantFull extends Restaurant {
  categories: (MenuCategory & { items: MenuItemWithTranslations[]; layout_type?: string })[];
  phone: string | null;
  email: string | null;
  design?: RestaurantDesign;
}

export interface MenuItemWithTranslations extends MenuItem {
  translations: MenuTranslation[];
}

export { LANGUAGES } from "./languages";

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const ALLERGEN_ICONS: Record<string, string> = {
  Gluten: "🌾",
  Nuts: "🥜",
  Dairy: "🥛",
  Eggs: "🥚",
  Shellfish: "🦐",
  Soy: "🫘",
  Fish: "🐟",
};
