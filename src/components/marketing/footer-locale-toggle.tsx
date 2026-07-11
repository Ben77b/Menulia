"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  MARKETING_LOCALES,
  marketingHref,
  type MarketingLocale,
} from "@/lib/marketing/locale";

type FooterLocaleToggleProps = {
  /** When omitted, active locale is inferred from the current path. */
  locale?: MarketingLocale;
};

function resolveCurrentLocale(pathname: string, locale?: MarketingLocale): MarketingLocale {
  if (locale) return locale;
  return pathname === "/es" || pathname.startsWith("/es/") ? "es" : "en";
}

function resolveHref(pathname: string, target: MarketingLocale): string {
  const onTestimonials = pathname.includes("/testimonials");
  return marketingHref(target, onTestimonials ? "testimonials" : "");
}

export function FooterLocaleToggle({ locale }: FooterLocaleToggleProps) {
  const pathname = usePathname();
  const active = resolveCurrentLocale(pathname, locale);

  return (
    <nav
      aria-label={active === "es" ? "Selector de idioma" : "Language selector"}
      className="inline-flex items-center gap-1.5 text-xs font-medium"
    >
      {MARKETING_LOCALES.map((code, index) => {
        const isActive = code === active;
        return (
          <span key={code} className="inline-flex items-center gap-1.5">
            {index > 0 ? (
              <span className="select-none text-slate-300" aria-hidden>
                |
              </span>
            ) : null}
            <Link
              href={resolveHref(pathname, code)}
              hrefLang={code}
              className={cn(
                "rounded px-1.5 py-0.5 tracking-wide transition-colors",
                isActive
                  ? "font-semibold text-[#22c55e]"
                  : "text-slate-500 hover:text-[#22c55e]"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {code.toUpperCase()}
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
