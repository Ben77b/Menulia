"use client";

/** Global error — required html/body; white page, no reload loop. */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  if (typeof console !== "undefined") {
    console.error("[error-boundary:global]", error);
  }

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#ffffff", minHeight: "100vh" }} />
    </html>
  );
}
