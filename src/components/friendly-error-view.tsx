"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

type FriendlyErrorViewProps = {
  error: Error & { digest?: string };
  reset: () => void;
  scope?: string;
};

export function FriendlyErrorView({ error, reset, scope }: FriendlyErrorViewProps) {
  useEffect(() => {
    console.error(`[error-boundary${scope ? `:${scope}` : ""}]`, error);
  }, [error, scope]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-[0_8px_24px_rgba(15,23,42,0.06)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
          Menulia
          {scope ? ` · ${scope}` : ""}
        </p>
        <h1 className="mt-3 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          Database momentarily unavailable
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          Something went wrong while loading data. Your work is safe — click refresh to try again.
        </p>
        <Button type="button" size="lg" onClick={reset} className="mt-6 min-h-11 w-full sm:w-auto">
          Click to refresh
        </Button>
      </div>
    </div>
  );
}
