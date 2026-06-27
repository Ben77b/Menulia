"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRestaurant } from "@/contexts/restaurant-context";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { restaurants, loading } = useRestaurant();

  useEffect(() => {
    if (loading) return;

    if (restaurants.length > 0) {
      router.replace(`/dashboard/${restaurants[0].id}`);
    }
  }, [loading, restaurants, router]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-gray-500">Loading your restaurants...</p>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
        <p className="text-lg font-medium text-gray-900">No restaurants yet</p>
        <p className="text-sm text-gray-500">
          Use the sidebar to add your first restaurant.
        </p>
      </div>
    );
  }

  return null;
}
