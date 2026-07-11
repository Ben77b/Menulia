"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LANDING_COPY,
  alternateMarketingLocale,
  marketingHref,
  type MarketingLocale,
} from "@/lib/marketing/locale";

type MarketingHeaderProps = {
  locale: MarketingLocale;
};

export function MarketingHeader({ locale }: MarketingHeaderProps) {
  const copy = LANDING_COPY[locale];
  const altLocale = alternateMarketingLocale(locale);
  const homeHref = marketingHref(locale);
  const testimonialsHref = marketingHref(locale, "testimonials");
  const langSwitchHref = marketingHref(altLocale);

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { href: `${homeHref}#como-funciona`, label: copy.navHowItWorks },
    { href: testimonialsHref, label: copy.navTestimonials, isPage: true },
  ];

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-16 border-b border-slate-200/80 bg-white/85 backdrop-blur-md transition-all duration-300",
        scrolled && "shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
      )}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href={`${homeHref}#top`} className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#22c55e] text-sm font-bold text-white shadow-[0_0_16px_rgba(34,197,94,0.35)]">
            M
          </span>
          <span className="text-sm font-semibold tracking-tight text-slate-900">Menulia</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
          {navItems.map((item) =>
            item.isPage ? (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-slate-600 transition-colors hover:text-[#22c55e]"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-slate-600 transition-colors hover:text-[#22c55e]"
              >
                {item.label}
              </a>
            )
          )}
          <Link
            href={langSwitchHref}
            className="text-sm font-medium text-[#22c55e] transition-opacity hover:opacity-80"
            hrefLang={altLocale}
          >
            {copy.langSwitch}
          </Link>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-slate-700 hover:text-[#22c55e]">
              {copy.signIn}
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="rounded-[10px] neon-btn-primary">
              {copy.startFree}
            </Button>
          </Link>
        </div>

        <button
          type="button"
          className="rounded-[10px] p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "border-t border-slate-200 bg-white/95 backdrop-blur-md md:hidden",
          open ? "block" : "hidden"
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-3" aria-label="Mobile">
          {navItems.map((item) =>
            item.isPage ? (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[10px] px-3 py-2.5 text-sm text-slate-700 hover:bg-[#22c55e]/8 hover:text-[#22c55e]"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.href}
                href={item.href}
                className="rounded-[10px] px-3 py-2.5 text-sm text-slate-700 hover:bg-[#22c55e]/8 hover:text-[#22c55e]"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            )
          )}
          <Link
            href={langSwitchHref}
            className="rounded-[10px] px-3 py-2.5 text-sm font-medium text-[#22c55e]"
            onClick={() => setOpen(false)}
            hrefLang={altLocale}
          >
            {copy.langSwitch}
          </Link>
          <div className="mt-2 flex gap-2">
            <Link href="/login" className="flex-1">
              <Button variant="ghost" className="w-full border border-slate-200" size="sm">
                {copy.signIn}
              </Button>
            </Link>
            <Link href="/signup" className="flex-1">
              <Button className="w-full rounded-[10px] neon-btn-primary" size="sm">
                {copy.startFree}
              </Button>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
