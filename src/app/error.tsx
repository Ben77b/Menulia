"use client";

import { useEffect } from "react";

/** Root error boundary — log only, no auto-reset/reload loops. */
export default function RootError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error-boundary:root]", error);
  }, [error]);

  return null;
}
