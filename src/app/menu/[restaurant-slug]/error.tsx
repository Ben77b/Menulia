"use client";

import { useEffect } from "react";

/**
 * Public menu error boundary — log only.
 * Do not auto-reset or reload (that caused infinite black-screen loops).
 * Parent layout still wraps this segment.
 */
export default function PublicMenuSlugError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error-boundary:public-menu]", error);
  }, [error]);

  return null;
}
