"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  font_pack_id?: string;
  user_id?: string;
}

interface RestaurantContextType {
  currentRestaurant: Restaurant | null;
  setCurrentRestaurant: (restaurant: Restaurant) => void;
  restaurants: Restaurant[];
  loading: boolean;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  // Safety timeout to force loading to false after 3 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Forcing restaurant loading to false due to timeout');
        setLoading(false);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    // Load saved restaurant from localStorage
    const saved = localStorage.getItem("menulia_current_restaurant");
    if (saved && restaurants.length > 0) {
      try {
        const parsed = JSON.parse(saved);
        const exists = restaurants.find(r => r.id === parsed.id);
        if (exists) {
          setCurrentRestaurant(parsed);
        } else if (restaurants.length > 0) {
          setCurrentRestaurant(restaurants[0]);
        }
      } catch (e) {
        if (restaurants.length > 0) {
          setCurrentRestaurant(restaurants[0]);
        }
      }
    } else if (restaurants.length > 0) {
      setCurrentRestaurant(restaurants[0]);
    }
  }, [restaurants]);

  async function loadRestaurants() {
    try {
      setLoading(true);
      console.log('Loading restaurants...');

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Supabase Context Auth Error:', authError);
        throw authError;
      }
      if (!user) {
        console.log('No user found, setting loading to false');
        setRestaurants([]);
        setCurrentRestaurant(null);
        return;
      }

      console.log('User found:', user.id);
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, slug, font_pack_id, user_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Supabase Context Query Error:', error);
        throw error;
      }

      console.log('Restaurants loaded:', data?.length || 0);
      setRestaurants(data || []);

      // Safety clause: if no restaurants found, ensure loading is set to false
      if (!data || data.length === 0) {
        console.log('No restaurants found for user');
        setCurrentRestaurant(null);
      }
    } catch (error) {
      console.error('Supabase Context Error:', error);
      setRestaurants([]);
      setCurrentRestaurant(null);
    } finally {
      console.log('Setting loading to false in finally block');
      setLoading(false);
    }
  }

  const handleSetRestaurant = (restaurant: Restaurant) => {
    setCurrentRestaurant(restaurant);
    localStorage.setItem("menulia_current_restaurant", JSON.stringify(restaurant));
    // Trigger data refresh by emitting a custom event
    window.dispatchEvent(new CustomEvent("restaurantChanged", { detail: restaurant }));
  };

  return (
    <RestaurantContext.Provider
      value={{
        currentRestaurant,
        setCurrentRestaurant: handleSetRestaurant,
        restaurants,
        loading,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error("useRestaurant must be used within a RestaurantProvider");
  }
  return context;
}
