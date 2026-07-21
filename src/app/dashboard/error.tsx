"use client";

/**
 * Dashboard error boundary — silent auto-reset on mount, floating refresh banner
 * if recovery fails (never a blocking full-screen error page).
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
