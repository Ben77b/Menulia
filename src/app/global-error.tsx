"use client";

import { useEffect, useRef } from "react";

/**
 * Root layout errors must render html/body.
 * Immediately recover — no placeholder headers or empty marketing chrome.
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
    const id = window.setTimeout(() => {
      try {
        reset();
      } catch {
        window.location.reload();
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [reset]);

  return (
    <html lang="en">
      <body style={{ margin: 0 }} />
    </html>
  );
}
