"use client";

/**
 * Dashboard error boundary — silent auto-reset (no floating refresh banner).
 */
import { FriendlyErrorView } from "@/components/friendly-error-view";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <FriendlyErrorView error={error} reset={reset} scope="dashboard" />;
}
