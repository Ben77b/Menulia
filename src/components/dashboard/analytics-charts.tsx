"use client";

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { PageView, Reservation, BusinessExpense } from "@/lib/types";
import { format, parseISO, startOfMonth } from "date-fns";

const PIE_COLORS = ["#047857", "#F97316", "#3b82f6", "#a855f7", "#ec4899"];

interface AnalyticsChartsProps {
  pageViews: PageView[];
  reservations: Reservation[];
  expenses: BusinessExpense[];
}

export function AnalyticsCharts({ pageViews, reservations, expenses }: AnalyticsChartsProps) {
  const trafficData = buildMonthlyTraffic(pageViews, reservations);
  const seasonalityData = buildSeasonality(pageViews);
  const expensePie = buildExpenseBreakdown(expenses);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-white p-6">
        <h3 className="mb-1 text-lg font-semibold">Main Insights Board</h3>
        <p className="mb-6 text-sm text-text-secondary">
          Visitor traffic vs. completed reservation conversions
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={trafficData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="views" fill="#047857" name="Page Views" radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="conversions" stroke="#F97316" strokeWidth={2} name="Completed Reservations" dot={{ fill: "#F97316" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6">
        <h3 className="mb-1 text-lg font-semibold">Seasonality Graph</h3>
        <p className="mb-6 text-sm text-text-secondary">
          Monthly traffic peaks — best and worst performing months highlighted
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={seasonalityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="views" name="Views" radius={[4, 4, 0, 0]}>
              {seasonalityData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.isBest ? "#047857" : entry.isWorst ? "#F97316" : "#a7f3d0"}
                />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6">
        <h3 className="mb-1 text-lg font-semibold">Expense Distribution</h3>
        <p className="mb-6 text-sm text-text-secondary">Operational cost breakdown by category</p>
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={expensePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {expensePie.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `€${Number(v).toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="space-y-2 text-sm">
            {expensePie.map((e, i) => (
              <li key={e.name} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
                {e.name}: €{e.value.toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function safeMonthKey(iso: string | null | undefined, withYear: boolean): string | null {
  if (!iso) return null;
  try {
    return withYear
      ? format(startOfMonth(parseISO(iso)), "MMM yyyy")
      : format(parseISO(iso), "MMM");
  } catch {
    return null;
  }
}

function buildMonthlyTraffic(
  views: PageView[] | null | undefined,
  reservations: Reservation[] | null | undefined
) {
  const months = new Map<string, { views: number; conversions: number }>();

  (views ?? []).forEach((v) => {
    const m = safeMonthKey(v?.viewed_at, true);
    if (!m) return;
    const cur = months.get(m) ?? { views: 0, conversions: 0 };
    cur.views++;
    months.set(m, cur);
  });

  (reservations ?? [])
    .filter((r) => r?.status === "completed")
    .forEach((r) => {
      const m = safeMonthKey(r?.reserved_at, true);
      if (!m) return;
      const cur = months.get(m) ?? { views: 0, conversions: 0 };
      cur.conversions++;
      months.set(m, cur);
    });

  return Array.from(months.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
}

function buildSeasonality(views: PageView[] | null | undefined) {
  const months = new Map<string, number>();
  (views ?? []).forEach((v) => {
    const m = safeMonthKey(v?.viewed_at, false);
    if (!m) return;
    months.set(m, (months.get(m) ?? 0) + 1);
  });

  const data = Array.from(months.entries()).map(([month, views]) => ({ month, views }));
  if (data.length === 0) return [];
  const max = Math.max(...data.map((d) => d.views));
  const min = Math.min(...data.map((d) => d.views));

  return data.map((d) => ({
    ...d,
    isBest: d.views === max,
    isWorst: d.views === min,
  }));
}

function buildExpenseBreakdown(expenses: BusinessExpense[] | null | undefined) {
  const map = new Map<string, number>();
  (expenses ?? []).forEach((e) => {
    if (!e?.category) return;
    map.set(e.category, (map.get(e.category) ?? 0) + (Number(e.amount) || 0));
  });
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}
