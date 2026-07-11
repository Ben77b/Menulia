"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MARKETING_LOCALES,
  marketingHref,
  type MarketingLocale,
} from "@/lib/marketing/locale";

const LOCALE_META: Record<
  MarketingLocale,
  { label: string; flag: string; short: string }
> = {
  en: { label: "English", flag: "🇬🇧", short: "EN" },
  es: { label: "Español", flag: "🇪🇸", short: "ES" },
};

type MarketingLanguageSelectorProps = {
  locale: MarketingLocale;
  className?: string;
  onSelect?: () => void;
};

function resolveHref(pathname: string, target: MarketingLocale): string {
  const onTestimonials = pathname.includes("/testimonials");
  return marketingHref(target, onTestimonials ? "testimonials" : "");
}

export function MarketingLanguageSelector({
  locale,
  className,
  onSelect,
}: MarketingLanguageSelectorProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = LOCALE_META[locale];

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function handleSelect() {
    setOpen(false);
    onSelect?.();
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-all",
          "hover:border-[#22c55e]/40 hover:shadow-[0_0_12px_rgba(34,197,94,0.12)]",
          open && "border-[#22c55e]/40 shadow-[0_0_16px_rgba(34,197,94,0.15)]",
          className?.includes("w-full") && "w-full justify-between"
        )}
      >
        <span aria-hidden>{current.flag}</span>
        <span>{current.short}</span>
        <ChevronDown
          className={cn("h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className={cn(
            "absolute top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-[0_12px_40px_rgba(0,0,0,0.1)]",
            className?.includes("w-full") ? "inset-x-0" : "right-0 min-w-[10rem]"
          )}
        >
          {MARKETING_LOCALES.map((code) => {
            const meta = LOCALE_META[code];
            const selected = code === locale;
            return (
              <li key={code} role="option" aria-selected={selected}>
                <Link
                  href={resolveHref(pathname, code)}
                  hrefLang={code}
                  onClick={handleSelect}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors",
                    selected
                      ? "bg-[#22c55e]/10 font-medium text-[#16a34a]"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span aria-hidden>{meta.flag}</span>
                  {meta.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
