"use client";

import { useEffect, useRef } from "react";

/**
 * Root layout errors — keep a visible white frame (never an empty/black document).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const attempted = useRef(false);

  useEffect(() => {
    console.error("[error-boundary:global]", error);
  }, [error]);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    const id = window.setTimeout(() => reset(), 50);
    return () => window.clearTimeout(id);
  }, [reset]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#ffffff", color: "#0f172a" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <header style={{ padding: "20px 16px", borderBottom: "1px solid #f5f5f5" }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Menulia</p>
          </header>
          <main style={{ flex: 1, padding: 24 }} />
        </div>
      </body>
    </html>
  );
}
