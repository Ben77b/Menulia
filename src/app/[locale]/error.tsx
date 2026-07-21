"use client";

import { FriendlyErrorView } from "@/components/friendly-error-view";

export default function MarketingLocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <FriendlyErrorView error={error} reset={reset} scope="marketing-locale" />;
}
