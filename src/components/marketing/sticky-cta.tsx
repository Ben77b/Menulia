"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function StickyCta() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 720);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dismissed || !show) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-md">
      <p className="flex-1 text-sm font-medium text-slate-900">¿Listo para lanzar tu menú?</p>
      <Link href="/signup">
        <Button size="sm" className="rounded-[10px] neon-btn-primary">
          Empezar gratis
        </Button>
      </Link>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="rounded-[10px] p-1 text-muted-foreground hover:bg-muted hover:text-slate-900"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
