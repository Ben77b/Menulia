"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useRestaurant, type RestaurantSummary } from "@/contexts/restaurant-context";

export function useActiveRestaurant(): {
  activeRestaurant: RestaurantSummary | null;
  awaitingWorkspace: boolean;
  showOnboardingLockout: boolean;
} {
  const params = useParams();
  const restaurantIdParam = params.restaurantId as string | undefined;
  const { currentRestaurant, restaurants, loading, isFetching, bootstrapped } = useRestaurant();

  const activeRestaurant = useMemo(() => {
    if (currentRestaurant?.id) return currentRestaurant;
    if (restaurantIdParam) {
      return restaurants.find((entry) => entry.id === restaurantIdParam) ?? null;
    }
    return restaurants[0] ?? null;
  }, [currentRestaurant, restaurantIdParam, restaurants]);

  const awaitingWorkspace =
    !bootstrapped || ((loading || isFetching) && restaurants.length === 0);

  const showOnboardingLockout =
    bootstrapped && !loading && !isFetching && restaurants.length === 0;

  return {
    activeRestaurant,
    awaitingWorkspace,
    showOnboardingLockout,
  };
}
