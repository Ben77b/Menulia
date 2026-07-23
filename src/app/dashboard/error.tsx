"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error-boundary:dashboard]", error);
  }, [error]);

  return null;
}
