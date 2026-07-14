"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRestaurant } from "@/contexts/restaurant-context";
import { CreateFirstRestaurantForm } from "@/components/dashboard/create-first-restaurant-form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function DashboardIndexPage() {
  const router = useRouter();
  const { restaurants, loading, bootstrapped, user, hasRestaurants, isFetching } = useRestaurant();

  useEffect(() => {
    if (!bootstrapped || loading || isFetching || !user) return;

    if (hasRestaurants) {
      router.replace(`/dashboard/${restaurants[0].id}`);
    }
  }, [bootstrapped, loading, isFetching, hasRestaurants, restaurants, router, user]);

  if (!bootstrapped || loading || isFetching) {
    return <LoadingSpinner label="Preparing your workspace..." />;
  }

  if (!user || hasRestaurants) {
    return null;
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">
      <div className="air-card air-card-pad w-full max-w-lg text-center">
        <h1 className="air-page-title text-2xl">
          Create your first restaurant to unlock your dashboard
        </h1>
        <p className="air-page-subtitle">
          Enter your restaurant name and public URL slug. Once saved, your full dashboard
          will unlock instantly.
        </p>
        <div className="mt-8 flex justify-center">
          <CreateFirstRestaurantForm />
        </div>
      </div>
      <Link href="/logout" className="air-link mt-6 text-neutral-500">
        Sign out
      </Link>
    </div>
  );
}
