"use client";

/**
 * Root error boundary — auto-recovers once via FriendlyErrorView, then shows a
 * non-blocking bottom banner instead of a full-page error screen.
 */
import { FriendlyErrorView } from "@/components/friendly-error-view";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <FriendlyErrorView error={error} reset={reset} scope="root" />;
}
