"use client";

/** Root error boundary — visible white frame, no reload loop. */
export default function RootError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  if (typeof console !== "undefined") {
    console.error("[error-boundary:root]", error);
  }

  return <div className="min-h-screen bg-white" />;
}
