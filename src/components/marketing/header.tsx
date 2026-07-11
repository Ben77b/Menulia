"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LANDING_COPY, marketingHref, type MarketingLocale } from "@/lib/marketing/locale";

type MarketingHeaderProps = {
  locale: MarketingLocale;
};

export function MarketingHeader({ locale }: MarketingHeaderProps) {
  const copy = LANDING_COPY[locale];
  const homeHref = marketingHref(locale);
  const testimonialsHref = marketingHref(locale, "testimonials");

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const navItems = [
    { href: `${homeHref}#como-funciona`, label: copy.navHowItWorks, isPage: false },
    { href: `${homeHref}#analytics`, label: copy.navAnalytics, isPage: false },
    { href: testimonialsHref, label: copy.navTestimonials, isPage: true },
  ];

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-md transition-all duration-300",
        scrolled && "shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
      )}
    >
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href={`${homeHref}#top`} className="flex items-center gap-2.5 justify-self-start">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#22c55e] text-sm font-bold text-white shadow-[0_0_16px_rgba(34,197,94,0.35)]">
            M
          </span>
          <span className="text-sm font-semibold tracking-tight text-slate-900">Menulia</span>
        </Link>

        <nav
          className="hidden items-center gap-8 justify-self-center lg:flex"
          aria-label="Primary"
        >
          {navItems.map((item) =>
            item.isPage ? (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm tracking-wide text-slate-600 transition-colors hover:text-[#22c55e]"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.href}
                href={item.href}
                className="text-sm tracking-wide text-slate-600 transition-colors hover:text-[#22c55e]"
              >
                {item.label}
              </a>
            )
          )}
        </nav>

        <div className="hidden items-center gap-4 justify-self-end lg:flex">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="px-4 text-slate-700 hover:text-[#22c55e]">
              {copy.signIn}
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="rounded-[10px] px-4 neon-btn-primary">
              {copy.startFree}
            </Button>
          </Link>
        </div>

        <button
          type="button"
          className="col-start-3 justify-self-end rounded-[10px] p-2.5 text-slate-700 transition-transform hover:bg-slate-100 active:scale-95 lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "fixed inset-x-0 top-16 bottom-0 z-40 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <button
          type="button"
          aria-label="Close menu overlay"
          className={cn(
            "absolute inset-0 bg-slate-900/25 backdrop-blur-[2px] transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setOpen(false)}
        />

        <div
          className={cn(
            "relative border-b border-slate-200 bg-white px-6 py-10 shadow-[0_20px_60px_rgba(0,0,0,0.08)] transition-all duration-300 ease-out",
            open ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
          )}
        >
          <nav className="flex flex-col gap-2" aria-label="Mobile">
            {navItems.map((item) =>
              item.isPage ? (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl px-4 py-3.5 text-base tracking-wide text-slate-800 transition-colors hover:bg-[#22c55e]/8 hover:text-[#22c55e]"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-xl px-4 py-3.5 text-base tracking-wide text-slate-800 transition-colors hover:bg-[#22c55e]/8 hover:text-[#22c55e]"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              )
            )}
          </nav>

          <div className="my-8 border-t border-slate-100" aria-hidden />

          <div className="flex flex-col gap-5">
            <Link href="/login" onClick={() => setOpen(false)} className="block w-full">
              <Button
                variant="ghost"
                className="h-12 min-h-12 w-full justify-center border border-slate-200 text-base tracking-wide"
              >
                {copy.signIn}
              </Button>
            </Link>
            <Link href="/signup" onClick={() => setOpen(false)} className="block w-full">
              <Button className="h-12 min-h-12 w-full rounded-xl text-base tracking-wide neon-btn-primary">
                {copy.startFree}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
