"use client";

export default function MenuSegmentError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  if (typeof console !== "undefined") {
    console.error("[error-boundary:menu]", error);
  }

  return (
    <div className="flex min-h-screen flex-col bg-white px-4 py-10 text-slate-900">
      <p className="mx-auto w-full max-w-4xl text-lg font-semibold tracking-tight">Menu</p>
    </div>
  );
}
