"use client";

import { useState, useEffect } from "react";
import { useActiveRestaurant } from "@/hooks/use-active-restaurant";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, LayoutTemplate, Palette, QrCode, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getPublicMenuUrl } from "@/lib/site-url";
import { useDashboardLocale } from "@/contexts/dashboard-locale-context";

export default function DashboardPage() {
  const { activeRestaurant, awaitingWorkspace } = useActiveRestaurant();
  const { t } = useDashboardLocale();
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
    activeRestaurant?.name || (awaitingWorkspace ? t("home.loading") : t("home.noRestaurant"));
  const showViewLiveSite = Boolean(activeRestaurant?.slug);

  const restaurantBase = activeRestaurant ? `/dashboard/${activeRestaurant.id}` : "";

  const quickSteps = activeRestaurant
    ? [
        {
          icon: LayoutTemplate,
          title: t("home.stepCategoriesTitle"),
          description: t("home.stepCategoriesDesc"),
          href: `${restaurantBase}/menu`,
          completed: (stats?.totalCategories || 0) > 0,
        },
        {
          icon: Palette,
          title: t("home.stepThemeTitle"),
          description: t("home.stepThemeDesc"),
          href: `${restaurantBase}/branding`,
          completed: false,
        },
        {
          icon: QrCode,
          title: t("home.stepQrTitle"),
          description: t("home.stepQrDesc"),
          href: `${restaurantBase}/qr`,
          completed: false,
        },
      ]
    : [];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="air-page-title">{t("home.welcome")}</h1>
          <p className="air-page-subtitle min-w-0">
            {t("home.managing")}{" "}
            <span className="inline-block max-w-full truncate align-bottom font-medium text-slate-900">
              {displayName}
            </span>
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
            {t("home.viewLiveSite")}
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3 sm:gap-5">
        <div className="rounded-xl border border-neutral-200/50 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-neutral-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
          <UtensilsCrossed className="h-5 w-5 text-neutral-500" />
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{stats?.totalCategories ?? 0}</p>
          <p className="mt-1 text-xs font-medium text-neutral-500">{t("home.statCategories")}</p>
        </div>
        <div className="rounded-xl border border-neutral-200/50 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-neutral-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
          <LayoutTemplate className="h-5 w-5 text-neutral-500" />
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{stats?.totalDishes ?? 0}</p>
          <p className="mt-1 text-xs font-medium text-neutral-500">{t("home.statDishes")}</p>
        </div>
        <div className="rounded-xl border border-neutral-200/50 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-neutral-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
          <QrCode className="h-5 w-5 text-neutral-500" />
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{stats?.totalLinks ?? 0}</p>
          <p className="mt-1 text-xs font-medium text-neutral-500">{t("home.statLinks")}</p>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200/50 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] md:p-6">
        <h2 className="text-base font-semibold tracking-tight text-slate-900">{t("home.getStarted")}</h2>
        <p className="mb-4 mt-1 text-xs text-neutral-500">{t("home.getStartedSubtitle")}</p>
        <div className="space-y-3">
          {quickSteps.map((step) => (
            <Link
              key={step.href}
              href={step.href}
              className="flex items-center gap-4 rounded-xl border border-neutral-200/50 p-4 transition-all duration-200 hover:border-neutral-300/60 hover:bg-neutral-50/80 hover:shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                <step.icon className="h-5 w-5 text-neutral-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-slate-900">{step.title}</h3>
                  {step.completed && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <p className="text-sm text-neutral-500">{step.description}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-neutral-400" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
