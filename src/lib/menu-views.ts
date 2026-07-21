import { createAnonClient, getSupabaseBrowserClient } from "@/lib/supabase";
import { logSupabaseAuditError, withSupabaseFallback } from "@/lib/supabase-safe";
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfDay,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  subDays,
  subYears,
} from "date-fns";

export type MenuViewDeviceType = "mobile" | "tablet" | "desktop" | "unknown";

export type MenuViewsTimeframe = "7d" | "30d" | "1y" | "all";

export type MenuViewRow = {
  id: string;
  restaurant_id: string;
  created_at: string;
  language: string;
  device_type: MenuViewDeviceType;
};

export type MenuViewsSeriesPoint = {
  label: string;
  dateKey: string;
  views: number;
};

export type MenuViewsSummary = {
  totalViews: number;
  mobileViews: number;
  desktopViews: number;
  languages: Record<string, number>;
  series: MenuViewsSeriesPoint[];
  recent: Array<{
    id: string;
    created_at: string;
    language: string;
    device_type: MenuViewDeviceType;
  }>;
};

const EMPTY_SUMMARY: MenuViewsSummary = {
  totalViews: 0,
  mobileViews: 0,
  desktopViews: 0,
  languages: {},
  series: [],
  recent: [],
};

export function detectDeviceType(userAgent: string): MenuViewDeviceType {
  const ua = userAgent.toLowerCase();
  if (!ua) return "unknown";
  if (/ipad|tablet|kindle|playbook|silk|(android(?!.*mobile))/.test(ua)) {
    return "tablet";
  }
  if (/mobi|iphone|ipod|android.*mobile|windows phone|blackberry/.test(ua)) {
    return "mobile";
  }
  return "desktop";
}

export function normalizeViewLanguage(raw: string | null | undefined): string {
  const value = (raw ?? "en").trim().toLowerCase();
  if (!value) return "en";
  const primary = value.split(/[-_]/)[0] ?? "en";
  return primary.slice(0, 8) || "en";
}

function timeframeStart(timeframe: MenuViewsTimeframe, now = new Date()): Date | null {
  switch (timeframe) {
    case "7d":
      return startOfDay(subDays(now, 6));
    case "30d":
      return startOfDay(subDays(now, 29));
    case "1y":
      return startOfDay(subYears(now, 1));
    case "all":
      return null;
  }
}

function buildSeries(
  rows: Array<{ created_at: string }>,
  timeframe: MenuViewsTimeframe,
  now = new Date()
): MenuViewsSeriesPoint[] {
  const start = timeframeStart(timeframe, now) ?? (rows.length
    ? startOfDay(parseISO(rows[rows.length - 1]!.created_at))
    : startOfDay(subDays(now, 6)));

  const useMonths = timeframe === "1y" || timeframe === "all";

  if (useMonths) {
    const months = eachMonthOfInterval({ start: startOfMonth(start), end: now });
    const counts = new Map<string, number>();
    for (const row of rows) {
      const key = format(parseISO(row.created_at), "yyyy-MM");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return months.map((month) => {
      const dateKey = format(month, "yyyy-MM");
      return {
        dateKey,
        label: format(month, "MMM yyyy"),
        views: counts.get(dateKey) ?? 0,
      };
    });
  }

  const days = eachDayOfInterval({ start, end: endOfDay(now) });
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = format(parseISO(row.created_at), "yyyy-MM-dd");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return days.map((day) => {
    const dateKey = format(day, "yyyy-MM-dd");
    return {
      dateKey,
      label: format(day, timeframe === "7d" ? "EEE d" : "MMM d"),
      views: counts.get(dateKey) ?? 0,
    };
  });
}

export async function fetchMenuViewsSummary(
  restaurantId: string,
  timeframe: MenuViewsTimeframe
): Promise<MenuViewsSummary> {
  return withSupabaseFallback(
    "menu-views.summary",
    async () => {
      const supabase = getSupabaseBrowserClient();
      const start = timeframeStart(timeframe);
      let query = supabase
        .from("menu_views")
        .select("id, restaurant_id, created_at, language, device_type")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false })
        .limit(5000);

      if (start) {
        query = query.gte("created_at", start.toISOString());
      }

      const { data, error } = await query;
      if (error) {
        logSupabaseAuditError("menu-views.summary", error);
        return EMPTY_SUMMARY;
      }

      const rows = (data ?? []) as MenuViewRow[];
      const languages: Record<string, number> = {};
      let mobileViews = 0;
      let desktopViews = 0;

      for (const row of rows) {
        const lang = normalizeViewLanguage(row.language);
        languages[lang] = (languages[lang] ?? 0) + 1;
        if (row.device_type === "mobile" || row.device_type === "tablet") {
          mobileViews += 1;
        } else if (row.device_type === "desktop") {
          desktopViews += 1;
        }
      }

      return {
        totalViews: rows.length,
        mobileViews,
        desktopViews,
        languages,
        series: buildSeries(rows, timeframe),
        recent: rows.slice(0, 8).map((row) => ({
          id: row.id,
          created_at: row.created_at,
          language: normalizeViewLanguage(row.language),
          device_type: row.device_type,
        })),
      };
    },
    EMPTY_SUMMARY
  );
}

export async function recordMenuViewAnon(input: {
  restaurantId: string;
  language?: string | null;
  deviceType?: MenuViewDeviceType;
}): Promise<boolean> {
  return withSupabaseFallback(
    "menu-views.recordAnon",
    async () => {
      const supabase = createAnonClient();
      const { error } = await supabase.from("menu_views").insert({
        restaurant_id: input.restaurantId,
        language: normalizeViewLanguage(input.language),
        device_type: input.deviceType ?? "unknown",
      });
      if (error) {
        logSupabaseAuditError("menu-views.recordAnon", error);
        return false;
      }
      return true;
    },
    false
  );
}
