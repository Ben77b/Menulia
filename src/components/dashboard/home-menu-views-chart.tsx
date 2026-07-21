"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Clock3, Globe2, ScanLine, Smartphone, Users } from "lucide-react";
import {
  fetchMenuViewsSummary,
  type MenuViewsSummary,
  type MenuViewsTimeframe,
} from "@/lib/menu-views";
import { useDashboardLocale } from "@/contexts/dashboard-locale-context";
import { cn } from "@/lib/utils";

const TIMEFRAMES: Array<{ id: MenuViewsTimeframe; labelKey: string }> = [
  { id: "7d", labelKey: "home.analyticsRange7d" },
  { id: "30d", labelKey: "home.analyticsRange30d" },
  { id: "1y", labelKey: "home.analyticsRange1y" },
  { id: "all", labelKey: "home.analyticsRangeAll" },
];

const EMPTY: MenuViewsSummary = {
  totalViews: 0,
  mobileViews: 0,
  desktopViews: 0,
  languages: {},
  series: [],
  recent: [],
};

function normalizeSummary(value: Partial<MenuViewsSummary> | null | undefined): MenuViewsSummary {
  return {
    totalViews: Number(value?.totalViews) || 0,
    mobileViews: Number(value?.mobileViews) || 0,
    desktopViews: Number(value?.desktopViews) || 0,
    languages: value?.languages && typeof value.languages === "object" ? value.languages : {},
    series: Array.isArray(value?.series) ? value.series : [],
    recent: Array.isArray(value?.recent) ? value.recent : [],
  };
}

function formatRecentTime(createdAt: string | null | undefined): string {
  if (!createdAt) return "—";
  try {
    return format(parseISO(createdAt), "MMM d, HH:mm");
  } catch {
    return "—";
  }
}

type HomeMenuViewsChartProps = {
  restaurantId: string | null | undefined;
  qrHref: string;
};

export function HomeMenuViewsChart({ restaurantId, qrHref }: HomeMenuViewsChartProps) {
  const { t } = useDashboardLocale();
  const [timeframe, setTimeframe] = useState<MenuViewsTimeframe>("7d");
  const [summary, setSummary] = useState<MenuViewsSummary>(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!restaurantId) {
      setSummary(EMPTY);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void fetchMenuViewsSummary(restaurantId, timeframe)
      .then((next) => {
        if (!cancelled) setSummary(normalizeSummary(next));
      })
      .catch(() => {
        if (!cancelled) setSummary(EMPTY);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [restaurantId, timeframe]);

  const languageCount = useMemo(
    () => Object.keys(summary.languages ?? {}).length,
    [summary.languages]
  );

  const mobileShare =
    summary.totalViews === 0
      ? 0
      : Math.round((summary.mobileViews / summary.totalViews) * 100);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">
            {t("home.analyticsTitle")}
          </h2>
          <p className="mt-1 text-xs text-neutral-500">{t("home.analyticsSubtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-xl border border-neutral-200/70 bg-neutral-50 p-1">
          {TIMEFRAMES.map((tab) => {
            const active = timeframe === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTimeframe(tab.id)}
                className={cn(
                  "min-h-9 rounded-lg px-3 text-xs font-semibold transition-colors",
                  active
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-neutral-500 hover:text-slate-800"
                )}
              >
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-xl border border-neutral-200/60 bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] sm:p-5">
          <div className="flex items-center gap-2 text-neutral-500">
            <ScanLine className="h-4 w-4" aria-hidden />
            <p className="text-xs font-medium">{t("home.metricQrScans")}</p>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {loading ? "—" : summary.totalViews.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200/60 bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] sm:p-5">
          <div className="flex items-center gap-2 text-neutral-500">
            <Smartphone className="h-4 w-4" aria-hidden />
            <p className="text-xs font-medium">{t("home.metricMobileShare")}</p>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {loading ? "—" : `${mobileShare}%`}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200/60 bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] sm:p-5">
          <div className="flex items-center gap-2 text-neutral-500">
            <Globe2 className="h-4 w-4" aria-hidden />
            <p className="text-xs font-medium">{t("home.metricLanguages")}</p>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            {loading ? "—" : languageCount.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200/60 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
          <h3 className="text-sm font-semibold text-slate-900">{t("home.trafficTitle")}</h3>
        </div>

        {!loading && summary.totalViews === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
            <Users className="h-8 w-8 text-neutral-300" aria-hidden />
            <p className="max-w-sm text-sm text-neutral-500">{t("home.analyticsZeroState")}</p>
            <a
              href={qrHref}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              {t("home.analyticsZeroCta")}
            </a>
          </div>
        ) : (
          <div className="px-2 pb-2 pt-4 sm:px-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.series ?? []} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="menuViewsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#737373" }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#737373" }}
                    tickLine={false}
                    axisLine={false}
                    width={32}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 8px 20px rgba(15,23,42,0.08)",
                    }}
                    formatter={(value) => [Number(value ?? 0), t("home.metricQrScans")]}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#d97706"
                    strokeWidth={2}
                    fill="url(#menuViewsFill)"
                    isAnimationActive
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {(summary.recent ?? []).length > 0 ? (
          <div className="border-t border-neutral-100">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-neutral-50/80 text-xs font-medium uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 sm:px-5">{t("home.trafficColTime")}</th>
                    <th className="px-4 py-3 sm:px-5">{t("home.trafficColLang")}</th>
                    <th className="px-4 py-3 sm:px-5">{t("home.trafficColDevice")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {(summary.recent ?? []).map((row) => (
                    <tr key={row?.id ?? row?.created_at} className="transition-colors hover:bg-neutral-50/60">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700 sm:px-5">
                        {formatRecentTime(row?.created_at)}
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-semibold uppercase text-slate-700">
                          {row?.language || "—"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 capitalize text-neutral-600 sm:px-5">
                        {row?.device_type || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        <p className="flex items-center gap-1.5 border-t border-neutral-100 px-4 py-2.5 text-[11px] text-neutral-400 sm:px-5">
          <Clock3 className="h-3 w-3" aria-hidden />
          {t("home.analyticsPrivacyNote")}
        </p>
      </div>
    </section>
  );
}
