"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Code2,
  Copy,
  Instagram,
  MapPin,
  QrCode,
} from "lucide-react";
import { useActiveRestaurant } from "@/hooks/use-active-restaurant";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { getPublicMenuUrl } from "@/lib/site-url";
import { buildMenuEmbedSnippet } from "@/lib/menu-embed-snippet";
import { useDashboardLocale } from "@/contexts/dashboard-locale-context";
import { cn } from "@/lib/utils";
import { HomeMenuViewsChart } from "@/components/dashboard/home-menu-views-chart";
import { logSupabaseAuditError } from "@/lib/supabase-safe";

type HomeStats = {
  totalCategories: number;
  totalDishes: number;
};

function qrQuestStorageKey(restaurantId: string) {
  return `menulia:home-quest-qr:${restaurantId}`;
}

export default function DashboardPage() {
  const { activeRestaurant, awaitingWorkspace } = useActiveRestaurant();
  const { t } = useDashboardLocale();
  const [stats, setStats] = useState<HomeStats>({ totalCategories: 0, totalDishes: 0 });
  const [qrShared, setQrShared] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  useEffect(() => {
    if (!activeRestaurant?.id) {
      setQrShared(false);
      return;
    }
    try {
      setQrShared(localStorage.getItem(qrQuestStorageKey(activeRestaurant.id)) === "1");
    } catch {
      setQrShared(false);
    }
  }, [activeRestaurant?.id]);

  useEffect(() => {
    if (!activeRestaurant) return;

    let cancelled = false;

    async function loadStats() {
      if (!activeRestaurant) return;
      try {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("id")
          .eq("restaurant_id", activeRestaurant.id);

        if (categoriesError) throw categoriesError;

        let dishesCount = 0;
        if (categoriesData && categoriesData.length > 0) {
          const { data: dishesResult, error: dishesError } = await supabase
            .from("dishes")
            .select("id")
            .in(
              "category_id",
              categoriesData.map((c) => c.id)
            );

          if (dishesError) throw dishesError;
          dishesCount = dishesResult?.length ?? 0;
        }

        if (!cancelled) {
          setStats({
            totalCategories: categoriesData?.length ?? 0,
            totalDishes: dishesCount,
          });
        }
      } catch (error) {
        logSupabaseAuditError("dashboard-home.stats", error);
        if (!cancelled) {
          setStats({ totalCategories: 0, totalDishes: 0 });
        }
      }
    }

    void loadStats();
    return () => {
      cancelled = true;
    };
  }, [activeRestaurant]);

  const displayName =
    activeRestaurant?.name || (awaitingWorkspace ? t("home.loading") : t("home.noRestaurant"));
  const showViewLiveSite = Boolean(activeRestaurant?.slug);
  const restaurantBase = activeRestaurant ? `/dashboard/${activeRestaurant.id}` : "";
  const publicMenuUrl = activeRestaurant ? getPublicMenuUrl(activeRestaurant.slug) : "";
  const embedSnippet = useMemo(
    () =>
      activeRestaurant
        ? buildMenuEmbedSnippet(activeRestaurant.slug, activeRestaurant.name)
        : "",
    [activeRestaurant]
  );

  const hasMenu = stats.totalCategories > 0 && stats.totalDishes > 0;
  const hasBranding = Boolean(activeRestaurant?.logo);

  const milestones = useMemo(
    () =>
      activeRestaurant
        ? [
            {
              id: "menu",
              title: t("home.questMenuTitle"),
              description: t("home.questMenuDesc"),
              href: `${restaurantBase}/menu`,
              completed: hasMenu,
            },
            {
              id: "branding",
              title: t("home.questBrandTitle"),
              description: t("home.questBrandDesc"),
              href: `${restaurantBase}/branding`,
              completed: hasBranding,
            },
            {
              id: "qr",
              title: t("home.questQrTitle"),
              description: t("home.questQrDesc"),
              href: `${restaurantBase}/qr`,
              completed: qrShared,
            },
          ]
        : [],
    [activeRestaurant, restaurantBase, hasMenu, hasBranding, qrShared, t]
  );

  const completedCount = milestones.filter((m) => m.completed).length;
  const progressPercent =
    milestones.length === 0 ? 0 : Math.round((completedCount / milestones.length) * 100);

  const markQrShared = useCallback(() => {
    if (!activeRestaurant?.id) return;
    try {
      localStorage.setItem(qrQuestStorageKey(activeRestaurant.id), "1");
    } catch {
      // ignore storage failures
    }
    setQrShared(true);
  }, [activeRestaurant?.id]);

  async function copyText(text: string, setCopied: (value: boolean) => void) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("[DashboardHome:Clipboard]", error);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="air-page-title">{t("home.welcome")}</h1>
          <p className="air-page-subtitle min-w-0">
            {t("home.managing")}{" "}
            <span className="inline-block max-w-full truncate align-bottom font-medium text-slate-900">
              {displayName}
            </span>
          </p>
        </div>
        {showViewLiveSite && activeRestaurant ? (
          <Button
            variant="light"
            href={publicMenuUrl}
            target="_blank"
            rel="noopener noreferrer"
            isExternal
            className="shrink-0"
          >
            {t("home.viewLiveSite")}
          </Button>
        ) : null}
      </div>

      <section className="rounded-2xl border border-neutral-200/60 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-slate-900">
              {t("home.questTitle")}
            </h2>
            <p className="mt-1 text-xs text-neutral-500">{t("home.questSubtitle")}</p>
          </div>
          <p className="text-sm font-semibold tabular-nums text-amber-700">{progressPercent}%</p>
        </div>

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("home.questTitle")}
          />
        </div>

        <ul className="mt-5 space-y-2.5">
          {milestones.map((milestone, index) => (
            <li key={milestone.id}>
              <Link
                href={milestone.href}
                onClick={milestone.id === "qr" ? markQrShared : undefined}
                className={cn(
                  "group flex items-start gap-3 rounded-xl border border-neutral-200/60 px-3.5 py-3.5 transition-all duration-200",
                  "hover:-translate-y-0.5 hover:border-neutral-300 hover:bg-neutral-50/80 hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]",
                  milestone.completed && "border-emerald-200/70 bg-emerald-50/40"
                )}
              >
                <span className="mt-0.5 shrink-0">
                  {milestone.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />
                  ) : (
                    <Circle className="h-5 w-5 text-neutral-300 group-hover:text-neutral-500" aria-hidden />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                      {index + 1}/{milestones.length}
                    </span>
                    <h3
                      className={cn(
                        "text-sm font-medium text-slate-900",
                        milestone.completed && "text-neutral-500 line-through decoration-neutral-400"
                      )}
                    >
                      {milestone.title}
                    </h3>
                  </div>
                  <p
                    className={cn(
                      "mt-0.5 text-sm text-neutral-500",
                      milestone.completed && "line-through decoration-neutral-300"
                    )}
                  >
                    {milestone.description}
                  </p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-neutral-300 transition-colors group-hover:text-neutral-600" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <HomeMenuViewsChart
        restaurantId={activeRestaurant?.id}
        qrHref={activeRestaurant ? `${restaurantBase}/qr` : "/dashboard"}
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">
            {t("home.growthTitle")}
          </h2>
          <p className="mt-1 text-xs text-neutral-500">{t("home.growthSubtitle")}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col rounded-xl border border-neutral-200/60 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(0,0,0,0.06)]">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
              <Instagram className="h-4 w-4 text-slate-700" aria-hidden />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">{t("home.growthSocialTitle")}</h3>
            <p className="mt-1.5 flex-1 text-sm text-neutral-500">{t("home.growthSocialDesc")}</p>
            <button
              type="button"
              disabled={!publicMenuUrl}
              onClick={() => void copyText(publicMenuUrl, setLinkCopied)}
              className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {linkCopied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  {t("common.copied")}
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  {t("home.growthCopyLink")}
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col rounded-xl border border-neutral-200/60 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(0,0,0,0.06)]">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
              <MapPin className="h-4 w-4 text-slate-700" aria-hidden />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">{t("home.growthMapsTitle")}</h3>
            <p className="mt-1.5 flex-1 text-sm text-neutral-500">{t("home.growthMapsDesc")}</p>
            <a
              href="https://business.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-neutral-50"
            >
              {t("home.growthMapsCta")}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="flex flex-col rounded-xl border border-neutral-200/60 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(0,0,0,0.06)]">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
              <Code2 className="h-4 w-4 text-slate-700" aria-hidden />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">{t("home.growthEmbedTitle")}</h3>
            <p className="mt-1.5 flex-1 text-sm text-neutral-500">{t("home.growthEmbedDesc")}</p>
            <button
              type="button"
              disabled={!embedSnippet}
              onClick={() => void copyText(embedSnippet, setEmbedCopied)}
              className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {embedCopied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  {t("common.copied")}
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4" />
                  {t("home.growthCopyEmbed")}
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
