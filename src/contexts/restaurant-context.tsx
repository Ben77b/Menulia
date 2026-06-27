"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { fetchRestaurantsForAuthenticatedUser } from "@/lib/data";

export interface RestaurantSummary {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  font_pack_id?: string;
  user_id?: string;
}

interface RestaurantContextType {
  currentRestaurant: RestaurantSummary | null;
  restaurants: RestaurantSummary[];
  loading: boolean;
  refreshRestaurants: () => Promise<RestaurantSummary[]>;
  switchRestaurant: (restaurantId: string) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

function toSummary(restaurant: {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  font_pack_id?: string;
  user_id?: string;
}): RestaurantSummary {
  return {
    id: restaurant.id,
    name: restaurant.name,
    slug: restaurant.slug,
    logo: restaurant.logo ?? null,
    font_pack_id: restaurant.font_pack_id,
    user_id: restaurant.user_id,
  };
}

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const restaurantId = params.restaurantId as string | undefined;
  const [currentRestaurant, setCurrentRestaurant] = useState<RestaurantSummary | null>(null);
  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchRestaurantsForAuthenticatedUser();
      const summaries = data.map(toSummary);
      setRestaurants(summaries);
      return summaries;
    } catch (error) {
      console.error("Failed to load restaurants:", error);
      setRestaurants([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  useEffect(() => {
    if (!restaurantId || restaurants.length === 0) {
      if (!restaurantId) {
        setCurrentRestaurant(null);
      }
      return;
    }

    const restaurant = restaurants.find((entry) => entry.id === restaurantId);
    setCurrentRestaurant(restaurant ?? null);
  }, [restaurantId, restaurants]);

  const switchRestaurant = useCallback(
    (id: string) => {
      const restaurant = restaurants.find((entry) => entry.id === id);
      if (restaurant) {
        setCurrentRestaurant(restaurant);
      }
    },
    [restaurants]
  );

  return (
    <RestaurantContext.Provider
      value={{
        currentRestaurant,
        restaurants,
        loading,
        refreshRestaurants: loadRestaurants,
        switchRestaurant,
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
