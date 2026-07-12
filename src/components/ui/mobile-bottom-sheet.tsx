"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  panelClassName?: string;
}

export function MobileBottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
  className,
  panelClassName,
}: MobileBottomSheetProps) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden
      />

      <aside
        className={cn(
          "fixed z-50 flex flex-col bg-white transition-transform duration-300 ease-out",
          "max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[90vh] max-md:rounded-t-2xl max-md:border-t max-md:border-[#E5E5EA] max-md:shadow-[0_-12px_40px_rgba(0,0,0,0.12)]",
          open ? "max-md:translate-y-0" : "max-md:translate-y-full",
          "md:right-0 md:top-0 md:h-full md:w-full md:max-w-md md:border-l md:border-[#E5E5EA] md:shadow-[0_8px_40px_rgba(0,0,0,0.08)]",
          open ? "md:translate-x-0" : "md:translate-x-full",
          className
        )}
        aria-hidden={!open}
      >
        <div className="flex shrink-0 justify-center pt-3 md:hidden" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-slate-200" />
        </div>

        <div className="flex shrink-0 items-center justify-between border-b border-[#F5F5F7] px-5 py-4">
          <h2 className="air-section-title text-lg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className={cn(
            "flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5",
            footer ? "pb-28 md:pb-5" : undefined,
            panelClassName
          )}
        >
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-50">
            {footer}
          </div>
        ) : null}
      </aside>
    </>
  );
}
