import {
  getRestaurantBySlug,
  getAllSlugs,
  getReservationsForRestaurant,
  getPageViewsForRestaurant,
  getExpensesForRestaurant,
  DEMO_RESTAURANT,
  MOCK_RESTAURANTS,
} from "./mock-data";
import type { RestaurantFull } from "./types";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "false";

export async function fetchRestaurantBySlug(slug: string): Promise<RestaurantFull | null> {
  if (USE_MOCK) return getRestaurantBySlug(slug);
  // Supabase integration point — swap when connected
  return getRestaurantBySlug(slug);
}

export async function fetchAllRestaurantSlugs(): Promise<string[]> {
  if (USE_MOCK) return getAllSlugs();
  return getAllSlugs();
}

export async function fetchDemoRestaurant() {
  return DEMO_RESTAURANT;
}

export async function fetchReservations(restaurantId: string) {
  return getReservationsForRestaurant(restaurantId);
}

export async function fetchPageViews(restaurantId: string) {
  return getPageViewsForRestaurant(restaurantId);
}

export async function fetchExpenses(restaurantId: string) {
  return getExpensesForRestaurant(restaurantId);
}

export async function fetchAllRestaurants() {
  return MOCK_RESTAURANTS;
}
