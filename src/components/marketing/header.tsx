"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "#features", label: "Features" },
  { href: "#demo", label: "Demo" },
  { href: "#pricing", label: "Pricing" },
  { href: "#contact", label: "Contact" },
];

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-16 border-b transition-all duration-200",
        scrolled
          ? "border-border bg-white/90 shadow-[var(--shadow-air-ambient)] backdrop-blur-md"
          : "border-transparent bg-white/80 backdrop-blur-sm"
      )}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/#top" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-slate-900 text-sm font-bold text-white">
            M
          </span>
          <span className="text-sm font-semibold tracking-tight text-slate-900">menulia.net</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-slate-900"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="dark" size="sm">
              Start free
            </Button>
          </Link>
        </div>

        <button
          type="button"
          className="rounded-[10px] p-2 text-slate-700 hover:bg-muted md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "border-t border-border bg-white md:hidden",
          open ? "block" : "hidden"
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-3" aria-label="Mobile">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-[10px] px-3 py-2.5 text-sm text-slate-700 hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <div className="mt-2 flex gap-2">
            <Link href="/login" className="flex-1">
              <Button variant="light" className="w-full" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/signup" className="flex-1">
              <Button variant="dark" className="w-full" size="sm">
                Start free
              </Button>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
