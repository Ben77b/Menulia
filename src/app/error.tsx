"use client";

import { DiagnosticErrorView } from "@/components/diagnostic-error-view";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <DiagnosticErrorView error={error} reset={reset} scope="root" />;
}
