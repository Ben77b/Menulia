"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const STACK_PREVIEW_LENGTH = 4000;

type DiagnosticErrorViewProps = {
  error: Error & { digest?: string };
  reset: () => void;
  scope?: string;
};

function clipStack(stack: string | undefined): string {
  if (!stack) return "(no stack trace available)";
  if (stack.length <= STACK_PREVIEW_LENGTH) return stack;
  return `${stack.slice(0, STACK_PREVIEW_LENGTH)}\n\n… [stack truncated]`;
}

export function DiagnosticErrorView({ error, reset, scope }: DiagnosticErrorViewProps) {
  useEffect(() => {
    console.error(`[error-boundary${scope ? `:${scope}` : ""}]`, error);
  }, [error, scope]);

  const name = error?.name ?? "(unknown error name)";
  const message = error?.message ?? "(no error message)";
  const digest = error?.digest ?? "(no digest)";
  const stack = clipStack(error?.stack);

  return (
    <div className="min-h-screen bg-red-950 px-4 py-10 text-red-50">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">
            Menulia runtime diagnostic
            {scope ? ` · ${scope}` : ""}
          </p>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Client-side exception captured
          </h1>
          <p className="text-sm text-red-200">
            This screen is shown by an App Router error boundary so the raw failure can be inspected
            without a blank page.
          </p>
        </header>

        <section
          aria-labelledby="error-diagnostics-heading"
          className="overflow-hidden rounded-xl border-2 border-red-400 bg-black/60 shadow-2xl shadow-red-950/80"
        >
          <div className="border-b border-red-500/50 bg-red-900/70 px-4 py-3">
            <h2 id="error-diagnostics-heading" className="text-lg font-semibold text-white">
              Raw error payload
            </h2>
          </div>

          <dl className="divide-y divide-red-900/80 font-mono text-sm">
            <div className="grid gap-2 px-4 py-4 sm:grid-cols-[8rem_1fr]">
              <dt className="font-semibold text-red-300">error.name</dt>
              <dd className="break-all whitespace-pre-wrap text-white">{name}</dd>
            </div>
            <div className="grid gap-2 px-4 py-4 sm:grid-cols-[8rem_1fr]">
              <dt className="font-semibold text-red-300">error.message</dt>
              <dd className="break-all whitespace-pre-wrap text-white">{message}</dd>
            </div>
            <div className="grid gap-2 px-4 py-4 sm:grid-cols-[8rem_1fr]">
              <dt className="font-semibold text-red-300">error.digest</dt>
              <dd className="break-all whitespace-pre-wrap text-white">{digest}</dd>
            </div>
            <div className="grid gap-2 px-4 py-4 sm:grid-cols-[8rem_1fr]">
              <dt className="shrink-0 font-semibold text-red-300">error.stack</dt>
              <dd className="max-h-[28rem] overflow-auto break-all whitespace-pre-wrap text-xs leading-relaxed text-red-100">
                {stack}
              </dd>
            </div>
          </dl>
        </section>

        <div>
          <Button
            type="button"
            size="lg"
            onClick={reset}
            className="h-14 min-w-[16rem] bg-white px-8 text-lg font-bold text-red-950 hover:bg-red-100"
          >
            Try to recover layout
          </Button>
        </div>
      </div>
    </div>
  );
}
