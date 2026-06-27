"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRestaurant } from "@/contexts/restaurant-context";
import { CreateFirstRestaurantForm } from "@/components/dashboard/create-first-restaurant-form";

export default function DashboardIndexPage() {
  const router = useRouter();
  const { restaurants, loading, authReady, user } = useRestaurant();

  useEffect(() => {
    if (!authReady || loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (restaurants.length > 0) {
      router.replace(`/dashboard/${restaurants[0].id}`);
    }
  }, [authReady, loading, restaurants, router, user]);

  if (!authReady || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-gray-500">Loading your account...</p>
      </div>
    );
  }

  if (!user || restaurants.length > 0) {
    return null;
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          Create your first restaurant to unlock your dashboard
        </h1>
        <p className="mt-3 text-sm text-gray-600">
          Add a name and URL slug below. Once saved, your menu builder, QR code, hours, and
          branding tools will appear in the sidebar.
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
