"use client";

import { useEffect } from "react";

/** Global error — required html/body; no reload loops. */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error-boundary:global]", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0 }} />
    </html>
  );
}
