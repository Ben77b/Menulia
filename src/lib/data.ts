import { supabase } from "./supabase";
import type { RestaurantFull } from "./types";

export async function fetchRestaurantBySlug(slug: string): Promise<RestaurantFull | null> {
  try {
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      // If slug column doesn't exist, try using id as fallback
      if (error.code === '42703') {
        const { data: restaurantById, error: idError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', slug)
          .single();
        
        if (idError) throw idError;
        if (!restaurantById) return null;

        // Fetch categories for this restaurant
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('restaurant_id', restaurantById.id)
          .order('order_index', { ascending: true });

        if (categoriesError) throw categoriesError;

        // Fetch dishes for each category
        const categoriesWithDishes = await Promise.all(
          (categories || []).map(async (category) => {
            const { data: dishes, error: dishesError } = await supabase
              .from('dishes')
              .select('*')
              .eq('category_id', category.id)
              .order('order_index', { ascending: true });

            if (dishesError) throw dishesError;

            return {
              ...category,
              items: dishes || [],
            };
          })
        );

        return {
          ...restaurantById,
          slug: restaurantById.id, // Use id as slug fallback
          categories: categoriesWithDishes,
        } as RestaurantFull;
      }
      throw error;
    }
    
    if (!restaurant) return null;

    // Fetch categories for this restaurant
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('order_index', { ascending: true });

    if (categoriesError) throw categoriesError;

    // Fetch dishes for each category
    const categoriesWithDishes = await Promise.all(
      (categories || []).map(async (category) => {
        const { data: dishes, error: dishesError } = await supabase
          .from('dishes')
          .select('*')
          .eq('category_id', category.id)
          .order('order_index', { ascending: true });

        if (dishesError) throw dishesError;

        return {
          ...category,
          items: dishes || [],
        };
      })
    );

    return {
      ...restaurant,
      categories: categoriesWithDishes,
    } as RestaurantFull;
  } catch (error) {
    console.error('Error fetching restaurant by slug:', error);
    return null;
  }
}

export async function fetchAllRestaurantSlugs(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, slug');

    if (error) {
      // If slug column doesn't exist, use id as fallback
      if (error.code === '42703') {
        const { data: restaurants, error: idError } = await supabase
          .from('restaurants')
          .select('id');
        
        if (idError) throw idError;
        return (restaurants || []).map(r => r.id);
      }
      throw error;
    }
    
    return (data || []).map(r => r.slug || r.id);
  } catch (error) {
    console.error('Error fetching restaurant slugs:', error);
    return [];
  }
}

export async function fetchDemoRestaurant() {
  // This is no longer needed with Supabase, but kept for compatibility
  return null;
}

export async function fetchReservations(restaurantId: string) {
  // To be implemented when reservation system is built
  return [];
}

export async function fetchPageViews(restaurantId: string) {
  // To be implemented when analytics are built
  return [];
}

export async function fetchExpenses(restaurantId: string) {
  // To be implemented when expense tracking is built
  return [];
}

export async function fetchAllRestaurants(userId?: string) {
  try {
    if (!userId) return [];
    
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all restaurants:', error);
    return [];
  }
}
