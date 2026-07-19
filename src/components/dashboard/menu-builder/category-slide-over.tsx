"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function CategorySlideOver({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <button
        type="button"
        aria-label="Close categories"
        className={cn(
          "fixed inset-0 z-40 bg-neutral-900/20 backdrop-blur-[1px] transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(320px,88vw)] flex-col border-r border-neutral-200/60 bg-white shadow-xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!open}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200/60 px-4 py-4">
          <h2 className="min-w-0 truncate text-base font-semibold text-neutral-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close categories panel"
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200/60 text-neutral-500 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/10"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        {children}
      </aside>
    </>
  );
}
