"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

type FriendlyErrorViewProps = {
  error: Error & { digest?: string };
  reset: () => void;
  scope?: string;
};

/** One auto-reset per error digest within the tab lifetime — avoids reset loops. */
const autoResetAttempted = new Set<string>();

function errorKey(error: Error & { digest?: string }, scope?: string) {
  return `${scope ?? "app"}:${error.digest ?? error.message ?? "unknown"}`;
}

/**
 * Silent auto-recovery error UI: tries `reset()` once, then shows a non-blocking
 * bottom banner instead of a full-page error screen.
 */
export function FriendlyErrorView({ error, reset, scope }: FriendlyErrorViewProps) {
  const loggedRef = useRef<string | null>(null);

  useEffect(() => {
    const key = errorKey(error, scope);
    if (loggedRef.current === key) return;
    loggedRef.current = key;
    console.error(`[error-boundary${scope ? `:${scope}` : ""}]`, error);
  }, [error, scope]);

  useEffect(() => {
    const key = errorKey(error, scope);
    if (autoResetAttempted.has(key)) return;
    autoResetAttempted.add(key);
    const id = window.setTimeout(() => {
      reset();
    }, 0);
    return () => window.clearTimeout(id);
  }, [error, reset, scope]);

  return (
    <div className="relative min-h-[30vh] w-full bg-transparent" aria-live="polite">
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex justify-center p-3 sm:p-4">
        <div className="pointer-events-auto flex max-w-lg items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white/95 px-4 py-3 shadow-[0_8px_28px_rgba(15,23,42,0.12)] backdrop-blur-sm">
          <p className="min-w-0 flex-1 text-sm text-slate-700">
            Something went wrong loading data. Your work is safe.
          </p>
          <Button
            type="button"
            size="sm"
            className="shrink-0"
            onClick={() => {
              window.location.reload();
            }}
          >
            Refresh Page
          </Button>
        </div>
      </div>
    </div>
  );
}
