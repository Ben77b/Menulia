"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DASHBOARD_LOCALE_COOKIE,
  DEFAULT_DASHBOARD_LOCALE,
  dashboardUiString,
  isDashboardLocale,
  readDashboardLocaleFromCookie,
  type DashboardLocale,
} from "@/lib/dashboard-i18n";

type DashboardLocaleContextValue = {
  locale: DashboardLocale;
  isMounted: boolean;
  setLocale: (locale: DashboardLocale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const DashboardLocaleContext = createContext<DashboardLocaleContextValue>({
  locale: DEFAULT_DASHBOARD_LOCALE,
  isMounted: false,
  setLocale: () => undefined,
  t: (key) => dashboardUiString(DEFAULT_DASHBOARD_LOCALE, key),
});

export function DashboardLocaleProvider({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const [locale, setLocaleState] = useState<DashboardLocale>(DEFAULT_DASHBOARD_LOCALE);

  useEffect(() => {
    setIsMounted(true);
    setLocaleState(readDashboardLocaleFromCookie());
  }, []);

  const setLocale = useCallback((next: DashboardLocale) => {
    setLocaleState(next);
    if (typeof document !== "undefined") {
      document.cookie = `${DASHBOARD_LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    }
  }, []);

  const effectiveLocale = isMounted ? locale : DEFAULT_DASHBOARD_LOCALE;

  const value = useMemo(
    () => ({
      locale: effectiveLocale,
      isMounted,
      setLocale,
      t: (key: string, vars?: Record<string, string | number>) =>
        dashboardUiString(effectiveLocale, key, vars),
    }),
    [effectiveLocale, isMounted, setLocale]
  );

  return (
    <DashboardLocaleContext.Provider value={value}>{children}</DashboardLocaleContext.Provider>
  );
}

export function useDashboardLocale() {
  return useContext(DashboardLocaleContext);
}

export function useDashboardLocaleFromDocument(): DashboardLocale {
  const { locale } = useDashboardLocale();
  return locale;
}

export function parseDashboardLocale(value: string | null | undefined): DashboardLocale {
  return isDashboardLocale(value) ? value : DEFAULT_DASHBOARD_LOCALE;
}
