"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import type { Restaurant } from "@/lib/types";

interface DashboardSidebarWrapperProps {
  restaurant: Restaurant;
  children: React.ReactNode;
  restaurants?: { id: string; name: string; slug: string }[];
}

export function DashboardSidebarWrapper({ restaurant, children, restaurants = [] }: DashboardSidebarWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentRestaurantId, setCurrentRestaurantId] = useState(restaurant.id);

  function handleRestaurantChange(id: string) {
    setCurrentRestaurantId(id);
    // In a real app, this would reload the page with the new restaurant
    window.location.href = `/dashboard?restaurant=${id}`;
  }

  return (
    <div className="flex min-h-screen">
      <div className="sticky top-0 h-screen">
        <DashboardSidebar
          isPremium={restaurant.is_premium}
          restaurantName={restaurant.name}
          restaurantSlug={restaurant.slug}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          restaurants={restaurants}
          currentRestaurantId={currentRestaurantId}
          onRestaurantChange={handleRestaurantChange}
        />
      </div>
      <div className="flex flex-1 flex-col overflow-auto">
        <DashboardHeader
          restaurant={restaurant}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <div className="flex-1 p-4 lg:p-6">{children}</div>
      </div>
    </div>
  );
}
