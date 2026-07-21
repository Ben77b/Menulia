"use client";

import { PublicMenuErrorShell } from "@/components/public/public-menu-error-shell";

export default function PublicMenuSlugError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PublicMenuErrorShell error={error} reset={reset} scope="public-menu" title="Menu" />
  );
}
