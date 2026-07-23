"use client";

import { useEffect } from "react";

/** Parent `/menu` segment — log only, no auto-reset/reload. */
export default function MenuSegmentError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error-boundary:menu]", error);
  }, [error]);

  return null;
}
