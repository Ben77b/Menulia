"use client";

/**
 * Public menu error boundary.
 * Prefer recovering the route rather than leaving guests on a one-word stub.
 */
export default function PublicMenuSlugError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("[error-boundary:public-menu]", error?.message, error?.digest, error);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-10 text-slate-900">
      <p className="text-lg font-semibold tracking-tight">Menu</p>
      <p className="mt-2 max-w-md text-center text-sm text-slate-500">
        Something went wrong loading this menu.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-full border border-slate-200 px-5 py-2 text-sm font-medium hover:bg-slate-50"
      >
        Try again
      </button>
    </div>
  );
}
