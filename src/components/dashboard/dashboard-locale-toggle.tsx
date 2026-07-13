"use client";

import { cn } from "@/lib/utils";
import { DASHBOARD_LOCALES } from "@/lib/dashboard-i18n";
import { useDashboardLocale } from "@/contexts/dashboard-locale-context";

export function DashboardLocaleToggle({ className }: { className?: string }) {
  const { locale, setLocale, t } = useDashboardLocale();

  return (
    <nav
      aria-label={t("locale.toggleLabel")}
      className={cn(
        "inline-flex items-center rounded-full border border-[#E5E5EA] bg-[#FAFAFA] p-0.5 text-xs font-semibold",
        className
      )}
    >
      {DASHBOARD_LOCALES.map((code) => {
        const isActive = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            className={cn(
              "min-w-[2.25rem] rounded-full px-2.5 py-1 tracking-wide transition-colors",
              isActive
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
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
