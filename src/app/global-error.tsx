"use client";

import { useEffect, useRef } from "react";

/**
 * Catches errors in the root layout itself.
 * Must render <html> and <body>; keep them empty — no error copy, no refresh UI.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const attempted = useRef(false);

  useEffect(() => {
    console.error("[error-boundary:global]", error);
  }, [error]);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    const id = window.setTimeout(() => reset(), 0);
    return () => window.clearTimeout(id);
  }, [reset]);

  return (
    <html lang="en">
      <body />
    </html>
  );
}
