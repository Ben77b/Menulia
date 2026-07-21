"use client";

import { useEffect, useRef } from "react";

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
 * Silent error recovery: logs + calls `reset()` once.
 * Renders nothing — no floating banners, refresh buttons, or overlays.
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

  return null;
}
