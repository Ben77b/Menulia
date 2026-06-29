"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRestaurant } from "@/contexts/restaurant-context";
import { CreateFirstRestaurantForm } from "@/components/dashboard/create-first-restaurant-form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function DashboardIndexPage() {
  const router = useRouter();
  const { restaurants, loading, bootstrapped, user, hasRestaurants } = useRestaurant();

  useEffect(() => {
    if (!bootstrapped || loading || !user) return;

    if (hasRestaurants) {
      router.replace(`/dashboard/${restaurants[0].id}`);
    }
  }, [bootstrapped, loading, hasRestaurants, restaurants, router, user]);

  if (!bootstrapped || loading) {
    return <LoadingSpinner label="Preparing your workspace..." />;
  }

  if (!user || hasRestaurants) {
    return null;
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">
      <div className="air-card w-full max-w-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Create your first restaurant to unlock your dashboard
        </h1>
        <p className="mt-3 text-sm text-gray-600">
          Enter your restaurant name and public URL slug. Once saved, your full dashboard
          will unlock instantly.
        </p>
        <div className="mt-8 flex justify-center">
          <CreateFirstRestaurantForm />
        </div>
      </div>
      <Link href="/logout" className="mt-6 text-sm text-gray-500 hover:text-gray-700">
        Sign out
      </Link>
    </div>
  );
}
