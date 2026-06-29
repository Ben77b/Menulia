"use client";

import { useState, useEffect } from "react";
import { useRestaurant } from "@/contexts/restaurant-context";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, LayoutTemplate, Palette, QrCode, ArrowRight, CheckCircle2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getPublicMenuUrl } from "@/lib/site-url";

export default function DashboardPage() {
  const { currentRestaurant, loading } = useRestaurant();
  const [stats, setStats] = useState({
    totalCategories: 0,
    totalDishes: 0,
    totalLinks: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (currentRestaurant) {
      loadStats();
    }
  }, [currentRestaurant]);

  async function loadStats() {
    if (!currentRestaurant) return;

    try {
      setStatsLoading(true);

      // Fetch categories count
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id')
        .eq('restaurant_id', currentRestaurant.id);

      if (categoriesError) throw categoriesError;

      // Fetch dishes count - only if we have categories
      let dishesData = [];
      if (categoriesData && categoriesData.length > 0) {
        const { data: dishesResult, error: dishesError } = await supabase
          .from('dishes')
          .select('id')
          .in('category_id', categoriesData.map(c => c.id));

        if (dishesError) throw dishesError;
        dishesData = dishesResult || [];
      }

      // Fetch custom links count
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('custom_links')
        .eq('id', currentRestaurant.id)
        .single();

      if (restaurantError) throw restaurantError;

      const customLinks = restaurantData?.custom_links || [];

      setStats({
        totalCategories: categoriesData?.length || 0,
        totalDishes: dishesData?.length || 0,
        totalLinks: customLinks.length || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      // Set safe fallback values on error
      setStats({
        totalCategories: 0,
        totalDishes: 0,
        totalLinks: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  }

  // Don't block page render - let layout render immediately
  // Stats will load in background

  // Always render the layout, show different content based on state
  const displayName = currentRestaurant?.name || (loading ? 'Loading...' : 'No restaurant selected');
  const showViewLiveSite = currentRestaurant?.slug && !loading;

  const restaurantBase = currentRestaurant ? `/dashboard/${currentRestaurant.id}` : "";

  const quickSteps = currentRestaurant
    ? [
        {
          icon: LayoutTemplate,
          title: "Build your categories",
          description: "Create menu categories to organize your dishes",
          href: `${restaurantBase}/menu`,
          completed: (stats?.totalCategories || 0) > 0,
        },
        {
          icon: Palette,
          title: "Design your theme",
          description: "Customize colors, fonts, and branding",
          href: `${restaurantBase}/branding`,
          completed: false,
        },
        {
          icon: QrCode,
          title: "Download your QR code",
          description: "Get a printable QR code for your menu",
          href: `${restaurantBase}/qr`,
          completed: false,
        },
      ]
    : [];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="air-page-title">Welcome back</h1>
          <p className="air-page-subtitle">
            Managing <span className="font-medium text-slate-900">{displayName}</span>
          </p>
        </div>
        {showViewLiveSite && currentRestaurant && (
          <Button
            variant="air"
            onClick={() => window.open(getPublicMenuUrl(currentRestaurant.slug), "_blank")}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View Live Site
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="air-card p-5">
          <UtensilsCrossed className="h-5 w-5 text-slate-600" />
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{stats?.totalCategories ?? 0}</p>
          <p className="text-sm text-[#86868B]">Total Menu Categories</p>
        </div>
        <div className="air-card p-5">
          <LayoutTemplate className="h-5 w-5 text-slate-600" />
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{stats?.totalDishes ?? 0}</p>
          <p className="text-sm text-[#86868B]">Total Active Dishes</p>
        </div>
        <div className="air-card p-5">
          <QrCode className="h-5 w-5 text-slate-600" />
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{stats?.totalLinks ?? 0}</p>
          <p className="text-sm text-[#86868B]">Dynamic Link Count</p>
        </div>
      </div>

      <div className="air-card air-card-pad">
        <h2 className="air-section-title mb-4">Get Started</h2>
        <div className="space-y-4">
          {quickSteps.map((step, index) => (
            <Link
              key={step.href}
              href={step.href}
              className="flex items-center gap-4 rounded-2xl border border-[#E5E5EA] p-4 transition-colors hover:border-slate-300 hover:bg-[#FAFAFA]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                <step.icon className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">{step.title}</h3>
                  {step.completed && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
