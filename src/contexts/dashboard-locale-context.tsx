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
  setLocale: (locale: DashboardLocale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const DashboardLocaleContext = createContext<DashboardLocaleContextValue>({
  locale: DEFAULT_DASHBOARD_LOCALE,
  setLocale: () => undefined,
  t: (key) => dashboardUiString(DEFAULT_DASHBOARD_LOCALE, key),
});

export function DashboardLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<DashboardLocale>(DEFAULT_DASHBOARD_LOCALE);

  useEffect(() => {
    setLocaleState(readDashboardLocaleFromCookie());
  }, []);

  const setLocale = useCallback((next: DashboardLocale) => {
    setLocaleState(next);
    document.cookie = `${DASHBOARD_LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: (key: string, vars?: Record<string, string | number>) => dashboardUiString(locale, key, vars),
    }),
    [locale, setLocale]
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
