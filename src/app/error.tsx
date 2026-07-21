"use client";

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
