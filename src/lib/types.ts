export type ReservationStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type ExpenseCategory = "Staff" | "Inventory" | "Rent" | "Utilities" | "Marketing";
import type { LanguageCode } from "./languages";
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
  logo_url: string | null;
  banner_url: string | null;
  phone: string | null;
  contact_email: string | null;
  address: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  website_url: string | null;
  whatsapp_url: string | null;
  is_premium: boolean;
  accepts_reservations: boolean;
}

export interface CustomRestaurantLink {
  id: string;
  restaurant_id: string;
  label: string;
  url: string;
}

export interface OperatingHour {
  id: string;
  restaurant_id: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
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

export interface Reservation {
  id: string;
  restaurant_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  date: string;
  time: string;
  party_size: number;
  status: ReservationStatus;
  special_requests: string | null;
}

export interface PageView {
  id: string;
  restaurant_id: string;
  viewed_at: string;
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
  custom_links: CustomRestaurantLink[];
  operating_hours: OperatingHour[];
  categories: (MenuCategory & { items: MenuItemWithTranslations[] })[];
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
