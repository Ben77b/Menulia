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
import { buildUserProfile, syncUserProfileRecord, type UserProfile } from "@/lib/auth/profile";
import { logAuthDiagnostic } from "@/lib/auth/messages";
import { resolveRestaurantSlugFromRow, queryRestaurantsForOwner } from "@/lib/restaurant-schema";

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
  userProfile: UserProfile | null;
  refreshRestaurants: () => Promise<RestaurantSummary[]>;
  switchRestaurant: (restaurantId: string) => void;
  activateRestaurant: (restaurantId: string, summary?: RestaurantSummary) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

function toSummary(restaurant: Record<string, unknown>): RestaurantSummary {
  return {
    id: String(restaurant.id),
    name: String(restaurant.name ?? ""),
    slug: resolveRestaurantSlugFromRow(restaurant),
    logo: (restaurant.logo as string | null) ?? (restaurant.logo_url as string | null) ?? null,
    font_pack_id: restaurant.font_pack_id as string | undefined,
    user_id: restaurant.user_id as string | undefined,
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const userIdRef = useRef<string | null>(null);

  const hasRestaurants = restaurants.length > 0;

  const clearSessionState = useCallback(() => {
    userIdRef.current = null;
    setUser(null);
    setUserProfile(null);
    setRestaurants([]);
    setCurrentRestaurant(null);
    localStorage.removeItem("menulia_current_restaurant");
  }, []);

  const hydrateAuthenticatedUser = useCallback(async (sessionUser: User) => {
    const profile = buildUserProfile(sessionUser);
    const supabase = getSupabaseBrowserClient();

    setUser(sessionUser);
    setUserProfile(profile);
    userIdRef.current = sessionUser.id;

    await syncUserProfileRecord(supabase, profile);
  }, []);

  const loadRestaurantsForUser = useCallback(async (userId: string) => {
    const supabase = getSupabaseBrowserClient();

    try {
      const { data, schema } = await queryRestaurantsForOwner(supabase, userId);
      const summaries = data.map((row) => toSummary(row));
      setRestaurants(summaries);
      return summaries;
    } catch (error) {
      logAuthDiagnostic("restaurants.load", error);
      console.dir(error, { depth: null });
      setRestaurants([]);
      return [];
    }
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
      logAuthDiagnostic("restaurants.refresh", error);
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

        if (sessionUser) {
          await hydrateAuthenticatedUser(sessionUser);
          await loadRestaurantsForUser(sessionUser.id);
        } else {
          clearSessionState();
        }
      } catch (error) {
        logAuthDiagnostic("bootstrap", error);
        if (mounted) {
          clearSessionState();
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

      if (event === "SIGNED_OUT") {
        clearSessionState();
        setLoading(false);
        setBootstrapped(true);

        if (pathname.startsWith("/dashboard")) {
          router.replace("/login");
        }
        return;
      }

      const sessionUser = session?.user ?? null;

      if (
        sessionUser &&
        (event === "SIGNED_IN" ||
          event === "INITIAL_SESSION" ||
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED")
      ) {
        setLoading(true);
        try {
          await hydrateAuthenticatedUser(sessionUser);
          await loadRestaurantsForUser(sessionUser.id);
        } catch (error) {
          logAuthDiagnostic(`auth.${event}`, error);
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
  }, [
    clearSessionState,
    hydrateAuthenticatedUser,
    loadRestaurantsForUser,
    pathname,
    router,
  ]);

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
        userProfile,
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
