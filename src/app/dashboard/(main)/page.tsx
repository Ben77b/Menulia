"use client";

import { useState, useEffect } from "react";
import { useRestaurant } from "@/contexts/restaurant-context";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, LayoutTemplate, Palette, QrCode, ArrowRight, CheckCircle2, ExternalLink } from "lucide-react";
import Link from "next/link";

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
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id')
        .eq('restaurant_id', currentRestaurant.id);

      // Fetch dishes count
      const { data: dishesData } = await supabase
        .from('dishes')
        .select('id')
        .in('category_id', (categoriesData || []).map(c => c.id));

      // Fetch custom links count
      const { data: restaurantData } = await supabase
        .from('restaurants')
        .select('custom_links')
        .eq('id', currentRestaurant.id)
        .single();

      const customLinks = restaurantData?.custom_links || [];

      setStats({
        totalCategories: categoriesData?.length || 0,
        totalDishes: dishesData?.length || 0,
        totalLinks: customLinks.length || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }

  if (loading || statsLoading) {
    return <div>Loading...</div>;
  }

  if (!currentRestaurant) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-text-secondary">
          Please select a restaurant to manage.
        </p>
      </div>
    );
  }

  const quickSteps = [
    {
      icon: LayoutTemplate,
      title: "Build your categories",
      description: "Create menu categories to organize your dishes",
      href: "/dashboard/menu",
      completed: stats.totalCategories > 0,
    },
    {
      icon: Palette,
      title: "Design your theme",
      description: "Customize colors, fonts, and branding",
      href: "/dashboard/branding",
      completed: false,
    },
    {
      icon: QrCode,
      title: "Download your QR code",
      description: "Get a printable QR code for your menu",
      href: "/dashboard/qr",
      completed: false,
    },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-600">
            Managing <span className="font-medium text-gray-900">{currentRestaurant.name}</span>
          </p>
        </div>
        {currentRestaurant.slug && (
          <Button
            onClick={() => window.open(`https://menulia.net/${currentRestaurant.slug}`, '_blank')}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View Live Site
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <UtensilsCrossed className="h-5 w-5 text-indigo-600" />
          <p className="mt-3 text-2xl font-bold text-gray-900">{stats.totalCategories}</p>
          <p className="text-sm text-gray-600">Total Menu Categories</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <LayoutTemplate className="h-5 w-5 text-indigo-600" />
          <p className="mt-3 text-2xl font-bold text-gray-900">{stats.totalDishes}</p>
          <p className="text-sm text-gray-600">Total Active Dishes</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <QrCode className="h-5 w-5 text-indigo-600" />
          <p className="mt-3 text-2xl font-bold text-gray-900">{stats.totalLinks}</p>
          <p className="text-sm text-gray-600">Dynamic Link Count</p>
        </div>
      </div>

      {/* Get Started / Quick Steps */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Get Started</h2>
        <div className="space-y-4">
          {quickSteps.map((step, index) => (
            <Link
              key={step.href}
              href={step.href}
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors"
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
