"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function StickyCta() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dismissed || !show) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-2xl border border-border bg-white/95 p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4">
      <p className="flex-1 text-sm font-medium">
        Ready to digitize your menu? <span className="text-emerald-brand">Start free.</span>
      </p>
      <Link href="/onboarding">
        <Button size="sm">Get started</Button>
      </Link>
      <button
        onClick={() => setDismissed(true)}
        className="text-text-secondary hover:text-text-primary"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
