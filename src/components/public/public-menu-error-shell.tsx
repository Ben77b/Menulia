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
 * White page frame only — no infinite skeleton / refresh chrome.
 * Retries once, then stays on a clean empty shell.
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
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10" />
    </div>
  );
}
