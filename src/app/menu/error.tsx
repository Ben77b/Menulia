"use client";

import { PublicMenuErrorShell } from "@/components/public/public-menu-error-shell";

export default function MenuSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PublicMenuErrorShell error={error} reset={reset} scope="menu" title="Menu" />;
}
