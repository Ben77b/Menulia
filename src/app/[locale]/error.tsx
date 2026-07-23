"use client";

import { useEffect } from "react";

export default function MarketingLocaleError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error-boundary:marketing-locale]", error);
  }, [error]);

  return null;
}
