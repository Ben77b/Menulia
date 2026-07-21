"use client";

import { useEffect, useRef } from "react";

/** Marketing locale error boundary — silent reset, no visible error UI. */
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
    const id = window.setTimeout(() => reset(), 0);
    return () => window.clearTimeout(id);
  }, [reset]);

  return null;
}
