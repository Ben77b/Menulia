"use client";

import { useEffect, useRef } from "react";

type PublicMenuErrorShellProps = {
  error: Error & { digest?: string };
  reset: () => void;
  scope: string;
  title?: string;
};

/**
 * Visible fallback for public menu error boundaries.
 * Keeps a real page frame (never null / empty body) and retries once silently.
 */
export function PublicMenuErrorShell({
  error,
  reset,
  scope,
  title = "Menu",
}: PublicMenuErrorShellProps) {
  const attempted = useRef(false);

  useEffect(() => {
    console.error(`[error-boundary:${scope}]`, error);
  }, [error, scope]);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    const id = window.setTimeout(() => reset(), 50);
    return () => window.clearTimeout(id);
  }, [reset]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="border-b border-neutral-100 px-4 py-5">
        <div className="mx-auto max-w-4xl">
          <p className="text-lg font-semibold tracking-tight">{title}</p>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-10">
        <div className="h-40 w-full max-w-sm animate-pulse rounded-2xl bg-neutral-100" />
        <div className="mt-6 h-4 w-2/3 max-w-md animate-pulse rounded bg-neutral-100" />
        <div className="mt-3 h-4 w-1/2 max-w-sm animate-pulse rounded bg-neutral-100" />
      </main>
    </div>
  );
}
