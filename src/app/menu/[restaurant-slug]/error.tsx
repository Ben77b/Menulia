"use client";

import { useEffect, useRef } from "react";

/**
 * Public menu error boundary — recover silently.
 * Layout still wraps this segment, so returning null does not paint a fake placeholder.
 */
export default function PublicMenuSlugError({
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

    const digest = error.digest ?? error.message ?? "unknown";
    const key = `menulia:menu-recover:${digest}`;
    try {
      if (sessionStorage.getItem(key) === "1") {
        // Already tried reset once this session — full reload to restore the real page.
        sessionStorage.removeItem(key);
        window.location.reload();
        return;
      }
      sessionStorage.setItem(key, "1");
    } catch {
      // ignore storage failures
    }

    const id = window.setTimeout(() => reset(), 0);
    return () => window.clearTimeout(id);
  }, [error, reset]);

  return null;
}
