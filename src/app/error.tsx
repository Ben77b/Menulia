"use client";

import { useEffect, useRef } from "react";

/** Silent recovery — no placeholder chrome. */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const attempted = useRef(false);

  useEffect(() => {
    console.error("[error-boundary:root]", error);
  }, [error]);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    const id = window.setTimeout(() => reset(), 0);
    return () => window.clearTimeout(id);
  }, [reset]);

  return null;
}
