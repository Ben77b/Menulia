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
        "inline-flex items-center rounded-full border border-neutral-200/50 bg-neutral-100/60 p-0.5 text-xs font-semibold shadow-sm shadow-black/[0.02]",
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
              "min-w-[2.25rem] rounded-full px-2.5 py-1 tracking-wide transition-all duration-200",
              isActive
                ? "bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-neutral-200/50"
                : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800",
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
