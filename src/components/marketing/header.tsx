"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [{ href: "#como-funciona", label: "Cómo funciona" }];

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
        "fixed inset-x-0 top-0 z-50 h-16 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md transition-all duration-300",
        scrolled && "shadow-[0_4px_30px_rgba(0,0,0,0.25)]"
      )}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/#top" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-indigo-500 text-sm font-bold text-white">
            M
          </span>
          <span className="text-sm font-semibold tracking-tight text-white">Menulia</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-slate-400 transition-colors hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:bg-white/10 hover:text-white"
            >
              Iniciar sesión
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100">
              Empezar gratis
            </Button>
          </Link>
        </div>

        <button
          type="button"
          className="rounded-[10px] p-2 text-slate-300 hover:bg-white/10 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "border-t border-slate-800 bg-slate-950/95 backdrop-blur-md md:hidden",
          open ? "block" : "hidden"
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-3" aria-label="Mobile">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-[10px] px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <div className="mt-2 flex gap-2">
            <Link href="/login" className="flex-1">
              <Button
                variant="ghost"
                className="w-full border border-slate-700 text-slate-200 hover:bg-white/5"
                size="sm"
              >
                Iniciar sesión
              </Button>
            </Link>
            <Link href="/signup" className="flex-1">
              <Button className="w-full bg-white text-slate-900 hover:bg-slate-100" size="sm">
                Empezar gratis
              </Button>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
