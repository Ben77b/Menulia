"use client";

import { useEffect, useRef } from "react";

/** Dashboard error boundary — visible light shell, silent retry. */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const attempted = useRef(false);

  useEffect(() => {
    console.error("[error-boundary:dashboard]", error);
  }, [error]);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    const id = window.setTimeout(() => reset(), 50);
    return () => window.clearTimeout(id);
  }, [reset]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="border-b border-neutral-100 px-4 py-5">
        <p className="text-lg font-semibold tracking-tight">Dashboard</p>
      </header>
      <main className="flex-1 px-4 py-10" />
    </div>
  );
}
