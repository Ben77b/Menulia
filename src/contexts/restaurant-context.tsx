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
  bootstrapped: boolean;
  user: User | null;
  refreshRestaurants: () => Promise<RestaurantSummary[]>;
  switchRestaurant: (restaurantId: string) => void;
  activateRestaurant: (restaurantId: string, summary?: RestaurantSummary) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

function toSummary(restaurant: {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  logo_url?: string | null;
  font_pack_id?: string;
  user_id?: string;
}): RestaurantSummary {
  return {
    id: restaurant.id,
    name: restaurant.name,
    slug: restaurant.slug,
    logo: restaurant.logo ?? restaurant.logo_url ?? null,
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
  const [bootstrapped, setBootstrapped] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const userIdRef = useRef<string | null>(null);

  const hasRestaurants = restaurants.length > 0;

  const loadRestaurantsForUser = useCallback(async (userId: string) => {
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from("restaurants")
      .select("id, name, slug, logo, logo_url, font_pack_id, user_id")
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

    setLoading(true);
    try {
      return await loadRestaurantsForUser(userIdRef.current);
    } catch (error) {
      console.error("Failed to refresh restaurants:", error);
      setRestaurants([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [loadRestaurantsForUser]);

  const activateRestaurant = useCallback((id: string, summary?: RestaurantSummary) => {
    if (summary) {
      setRestaurants((previous) => {
        if (previous.some((entry) => entry.id === id)) {
          return previous;
        }
        return [...previous, summary];
      });
      setCurrentRestaurant(summary);
      localStorage.setItem("menulia_current_restaurant", JSON.stringify(summary));
      return;
    }

    const restaurant = restaurants.find((entry) => entry.id === id);
    if (!restaurant) return;

    setCurrentRestaurant(restaurant);
    localStorage.setItem("menulia_current_restaurant", JSON.stringify(restaurant));
  }, [restaurants]);

  const switchRestaurant = useCallback(
    (id: string) => {
      activateRestaurant(id);
    },
    [activateRestaurant]
  );

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let mounted = true;

    async function bootstrap() {
      setLoading(true);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        const sessionUser = session?.user ?? null;
        setUser(sessionUser);
        userIdRef.current = sessionUser?.id ?? null;

        if (sessionUser) {
          await loadRestaurantsForUser(sessionUser.id);
        } else {
          setRestaurants([]);
          setCurrentRestaurant(null);
        }
      } catch (error) {
        console.error("Restaurant bootstrap failed:", error);
        if (mounted) {
          setRestaurants([]);
          setCurrentRestaurant(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setBootstrapped(true);
        }
      }
    }

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      userIdRef.current = sessionUser?.id ?? null;

      if (event === "SIGNED_OUT") {
        setRestaurants([]);
        setCurrentRestaurant(null);
        setLoading(false);
        setBootstrapped(true);
        return;
      }

      if (
        sessionUser &&
        (event === "SIGNED_IN" ||
          event === "INITIAL_SESSION" ||
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED")
      ) {
        setLoading(true);
        try {
          await loadRestaurantsForUser(sessionUser.id);
        } catch (error) {
          console.error("Failed to load restaurants after auth event:", error);
          setRestaurants([]);
        } finally {
          if (mounted) {
            setLoading(false);
            setBootstrapped(true);
          }
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadRestaurantsForUser]);

  useEffect(() => {
    if (!bootstrapped || restaurants.length === 0) {
      if (restaurants.length === 0) {
        setCurrentRestaurant(null);
      }
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
  }, [bootstrapped, restaurantId, restaurants]);

  useEffect(() => {
    if (!bootstrapped || loading || !user) return;

    if (pathname === "/dashboard" && restaurants.length > 0) {
      router.replace(`/dashboard/${restaurants[0].id}`);
    }
  }, [bootstrapped, loading, user, pathname, restaurants, router]);

  useEffect(() => {
    if (!bootstrapped || loading || !user) return;

    if (
      restaurantId &&
      restaurants.length > 0 &&
      !restaurants.some((entry) => entry.id === restaurantId)
    ) {
      router.replace(`/dashboard/${restaurants[0].id}`);
    }
  }, [bootstrapped, loading, user, restaurantId, restaurants, router]);

  return (
    <RestaurantContext.Provider
      value={{
        currentRestaurant,
        restaurants,
        hasRestaurants,
        loading,
        bootstrapped,
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
