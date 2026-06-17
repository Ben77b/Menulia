"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
}

interface RestaurantContextType {
  currentRestaurant: Restaurant | null;
  setCurrentRestaurant: (restaurant: Restaurant) => void;
  restaurants: Restaurant[];
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

const DEFAULT_RESTAURANTS: Restaurant[] = [
  { id: "1", name: "La Calle Tacos", slug: "la-calle-tacos" },
  { id: "2", name: "Sakura Omakase", slug: "sakura-omakase" },
  { id: "3", name: "Nonna Rosa Trattoria", slug: "nonna-rosa-trattoria" },
];

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);
  const [restaurants] = useState<Restaurant[]>(DEFAULT_RESTAURANTS);

  useEffect(() => {
    // Load saved restaurant from localStorage
    const saved = localStorage.getItem("menulia_current_restaurant");
    if (saved) {
      const parsed = JSON.parse(saved);
      setCurrentRestaurant(parsed);
    } else if (restaurants.length > 0) {
      // Default to first restaurant
      setCurrentRestaurant(restaurants[0]);
    }
  }, []);

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
