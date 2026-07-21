"use client";

import { useEffect, useRef } from "react";

export default function MarketingLocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const attempted = useRef(false);

  useEffect(() => {
    console.error("[error-boundary:marketing-locale]", error);
  }, [error]);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    const id = window.setTimeout(() => reset(), 50);
    return () => window.clearTimeout(id);
  }, [reset]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <main className="flex-1 px-4 py-10" />
    </div>
  );
}
