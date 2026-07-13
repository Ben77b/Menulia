"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { DASHBOARD_LOCALES, DEFAULT_DASHBOARD_LOCALE } from "@/lib/dashboard-i18n";
import { useDashboardLocale } from "@/contexts/dashboard-locale-context";

export function DashboardLocaleToggle({ className }: { className?: string }) {
  const { locale, setLocale, t, isMounted: localeMounted } = useDashboardLocale();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const displayLocale = isMounted && localeMounted ? locale : DEFAULT_DASHBOARD_LOCALE;
  const ariaLabel = isMounted && localeMounted ? t("locale.toggleLabel") : "Dashboard language";

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center rounded-full border border-[#E5E5EA] bg-[#FAFAFA] p-0.5 text-xs font-semibold",
        className
      )}
    >
      {DASHBOARD_LOCALES.map((code) => {
        const isActive = displayLocale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => {
              if (isMounted && localeMounted) {
                setLocale(code);
              }
            }}
            disabled={!isMounted || !localeMounted}
            className={cn(
              "min-w-[2.25rem] rounded-full px-2.5 py-1 tracking-wide transition-colors",
              isActive
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800",
              (!isMounted || !localeMounted) && "pointer-events-none"
            )}
            aria-pressed={isActive}
          >
            {code.toUpperCase()}
          </button>
        );
      })}
    </nav>
  );
}
