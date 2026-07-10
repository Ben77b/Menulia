"use client";

import { useState, useEffect } from "react";
import { useActiveRestaurant } from "@/hooks/use-active-restaurant";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, LayoutTemplate, Palette, QrCode, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getPublicMenuUrl } from "@/lib/site-url";

export default function DashboardPage() {
  const { activeRestaurant, awaitingWorkspace } = useActiveRestaurant();
  const [stats, setStats] = useState({
    totalCategories: 0,
    totalDishes: 0,
    totalLinks: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (activeRestaurant) {
      loadStats();
    }
  }, [activeRestaurant]);

  async function loadStats() {
    if (!activeRestaurant) return;

    try {
      setStatsLoading(true);

      // Fetch categories count
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id')
        .eq('restaurant_id', activeRestaurant.id);

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
        .eq('id', activeRestaurant.id)
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
  const displayName =
    activeRestaurant?.name || (awaitingWorkspace ? "Loading..." : "No restaurant selected");
  const showViewLiveSite = Boolean(activeRestaurant?.slug);

  const restaurantBase = activeRestaurant ? `/dashboard/${activeRestaurant.id}` : "";

  const quickSteps = activeRestaurant
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
        {showViewLiveSite && activeRestaurant && (
          <Button
            variant="light"
            href={getPublicMenuUrl(activeRestaurant.slug)}
            target="_blank"
            rel="noopener noreferrer"
            isExternal
          >
            View Live Site
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 sm:grid-cols-3 mb-8">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <UtensilsCrossed className="h-5 w-5 text-slate-600" />
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{stats?.totalCategories ?? 0}</p>
          <p className="mt-1 text-xs text-slate-400">Total Menu Categories</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <LayoutTemplate className="h-5 w-5 text-slate-600" />
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{stats?.totalDishes ?? 0}</p>
          <p className="mt-1 text-xs text-slate-400">Total Active Dishes</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <QrCode className="h-5 w-5 text-slate-600" />
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{stats?.totalLinks ?? 0}</p>
          <p className="mt-1 text-xs text-slate-400">Dynamic Link Count</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-base font-semibold text-slate-900">Get Started</h2>
        <p className="mt-1 mb-4 text-xs text-slate-400">Complete these steps to launch your digital menu.</p>
        <div className="space-y-4">
          {quickSteps.map((step, index) => (
            <Link
              key={step.href}
              href={step.href}
              className="flex items-center gap-4 rounded-2xl border border-[#E5E5EA] p-4 transition-colors hover:border-slate-300 hover:bg-[#FAFAFA]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <step.icon className="h-5 w-5 text-slate-700" />
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
