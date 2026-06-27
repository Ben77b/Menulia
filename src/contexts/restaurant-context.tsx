"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";

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
  hasRestaurants: boolean;
  loading: boolean;
  authReady: boolean;
  user: User | null;
  refreshRestaurants: () => Promise<RestaurantSummary[]>;
  switchRestaurant: (restaurantId: string) => void;
  activateRestaurant: (restaurantId: string) => void;
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
  const pathname = usePathname();
  const router = useRouter();
  const restaurantId = params.restaurantId as string | undefined;
  const [currentRestaurant, setCurrentRestaurant] = useState<RestaurantSummary | null>(null);
  const [restaurants, setRestaurants] = useState<RestaurantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const userIdRef = useRef<string | null>(null);

  const hasRestaurants = restaurants.length > 0;

  const loadRestaurantsForUser = useCallback(async (userId: string) => {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("restaurants")
      .select("id, name, slug, logo, font_pack_id, user_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const summaries = (data || []).map(toSummary);
    setRestaurants(summaries);
    return summaries;
  }, []);

  const refreshRestaurants = useCallback(async () => {
    if (!userIdRef.current) {
      setRestaurants([]);
      return [];
    }

    try {
      setLoading(true);
      return await loadRestaurantsForUser(userIdRef.current);
    } catch (error) {
      console.error("Failed to load restaurants:", error);
      setRestaurants([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [loadRestaurantsForUser]);

  const activateRestaurant = useCallback(
    (id: string) => {
      const restaurant = restaurants.find((entry) => entry.id === id);
      if (!restaurant) return;

      setCurrentRestaurant(restaurant);
      localStorage.setItem("menulia_current_restaurant", JSON.stringify(restaurant));
    },
    [restaurants]
  );

  const switchRestaurant = useCallback(
    (id: string) => {
      activateRestaurant(id);
    },
    [activateRestaurant]
  );

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let mounted = true;

    async function bootstrapSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      userIdRef.current = sessionUser?.id ?? null;
      setAuthReady(true);

      if (sessionUser) {
        try {
          setLoading(true);
          await loadRestaurantsForUser(sessionUser.id);
        } catch (error) {
          console.error("Failed to load restaurants during bootstrap:", error);
          setRestaurants([]);
        } finally {
          if (mounted) setLoading(false);
        }
      } else {
        setRestaurants([]);
        setCurrentRestaurant(null);
        setLoading(false);
      }
    }

    bootstrapSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      userIdRef.current = sessionUser?.id ?? null;
      setAuthReady(true);

      if (event === "SIGNED_OUT") {
        setRestaurants([]);
        setCurrentRestaurant(null);
        setLoading(false);
        return;
      }

      if (
        sessionUser &&
        (event === "SIGNED_IN" ||
          event === "INITIAL_SESSION" ||
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED")
      ) {
        try {
          setLoading(true);
          await loadRestaurantsForUser(sessionUser.id);
        } catch (error) {
          console.error("Failed to load restaurants after auth change:", error);
          setRestaurants([]);
        } finally {
          if (mounted) setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadRestaurantsForUser]);

  useEffect(() => {
    if (restaurants.length === 0) {
      setCurrentRestaurant(null);
      return;
    }

    if (restaurantId) {
      const matched = restaurants.find((entry) => entry.id === restaurantId);
      setCurrentRestaurant(matched ?? restaurants[0]);
      return;
    }

    const saved = localStorage.getItem("menulia_current_restaurant");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as RestaurantSummary;
        const exists = restaurants.find((entry) => entry.id === parsed.id);
        if (exists) {
          setCurrentRestaurant(exists);
          return;
        }
      } catch {
        localStorage.removeItem("menulia_current_restaurant");
      }
    }

    setCurrentRestaurant(restaurants[0]);
  }, [restaurantId, restaurants]);

  useEffect(() => {
    if (!authReady || loading || !user) return;

    if (pathname === "/dashboard" && restaurants.length > 0) {
      router.replace(`/dashboard/${restaurants[0].id}`);
    }
  }, [authReady, loading, user, pathname, restaurants, router]);

  useEffect(() => {
    if (!authReady || loading || !user) return;

    if (
      restaurantId &&
      restaurants.length > 0 &&
      !restaurants.some((entry) => entry.id === restaurantId)
    ) {
      router.replace(`/dashboard/${restaurants[0].id}`);
    }
  }, [authReady, loading, user, restaurantId, restaurants, router]);

  return (
    <RestaurantContext.Provider
      value={{
        currentRestaurant,
        restaurants,
        hasRestaurants,
        loading,
        authReady,
        user,
        refreshRestaurants,
        switchRestaurant,
        activateRestaurant,
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
