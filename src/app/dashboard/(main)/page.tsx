"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRestaurant } from "@/contexts/restaurant-context";
import { AddRestaurantModal } from "@/components/dashboard/add-restaurant-modal";
import { Button } from "@/components/ui/button";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { restaurants, loading, authReady, user } = useRestaurant();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!authReady || loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (restaurants.length > 0) {
      router.replace(`/dashboard/${restaurants[0].id}`);
      return;
    }

    setShowCreateModal(true);
  }, [authReady, loading, restaurants, router, user]);

  if (!authReady || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-gray-500">Loading your account...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (restaurants.length > 0) {
    return null;
  }

  return (
    <>
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Menulia</h1>
          <p className="mt-3 text-sm text-gray-600">
            Your account is ready. Create your first restaurant to unlock the menu builder,
            branding tools, and public menu page.
          </p>
          <Button className="mt-6 w-full" size="lg" onClick={() => setShowCreateModal(true)}>
            Create your first restaurant
          </Button>
          <p className="mt-4 text-xs text-gray-500">
            You can add more restaurants later from the sidebar.
          </p>
        </div>
        <Link href="/logout" className="text-sm text-gray-500 hover:text-gray-700">
          Sign out
        </Link>
      </div>

      <AddRestaurantModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        mode="first"
      />
    </>
  );
}
