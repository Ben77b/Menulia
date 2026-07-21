"use client";

/**
 * Public menu error boundary — guests must never see refresh banners or error chrome.
 * Silently attempts recovery via reset(); renders nothing.
 */
import { useEffect, useRef } from "react";

export default function PublicMenuError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const attempted = useRef(false);

  useEffect(() => {
    console.error("[error-boundary:public-menu]", error);
  }, [error]);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    const id = window.setTimeout(() => reset(), 0);
    return () => window.clearTimeout(id);
  }, [reset]);

  return null;
}
