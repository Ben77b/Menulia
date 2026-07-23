"use client";

/**
 * Public menu error boundary — keep the route shell visible.
 * No auto-reset / reload (those caused black-screen loops).
 */
export default function PublicMenuSlugError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  if (typeof console !== "undefined") {
    console.error("[error-boundary:public-menu]", error);
  }

  // Visible non-black fallback so guests never see an empty document.
  return (
    <div className="flex min-h-screen flex-col bg-white px-4 py-10 text-slate-900">
      <p className="mx-auto w-full max-w-4xl text-lg font-semibold tracking-tight">Menu</p>
    </div>
  );
}
