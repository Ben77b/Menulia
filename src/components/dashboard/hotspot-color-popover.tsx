"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { normalizeHexColor } from "@/lib/theme-colors";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HotspotColorPopoverProps {
  label: string;
  color: string;
  fallback: string;
  position: { top: number; left: number };
  onPreviewChange: (color: string) => void;
  onApply: () => void;
  onClose: () => void;
}

export function HotspotColorPopover({
  label,
  color,
  fallback,
  position,
  onPreviewChange,
  onApply,
  onClose,
}: HotspotColorPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const safeColor = normalizeHexColor(color, fallback);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [onClose]);

  return (
    <div
      ref={popoverRef}
      className={cn(
        "absolute z-50 w-56 rounded-xl border border-gray-200 bg-white p-4 shadow-xl",
        "animate-in fade-in zoom-in-95 duration-150"
      )}
      style={{
        top: position.top,
        left: position.left,
      }}
      role="dialog"
      aria-label={`Edit ${label} color`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Edit colour</p>
          <p className="text-sm font-semibold text-gray-900">{label}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
          <input
            type="color"
            value={safeColor}
            onChange={(e) => onPreviewChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer border-0 p-0"
          />
        </div>
        <input
          type="text"
          value={safeColor}
          onChange={(e) => {
            const next = e.target.value.trim();
            if (/^#[0-9A-Fa-f]{0,6}$/.test(next)) {
              onPreviewChange(next.length === 7 ? next : safeColor);
            }
          }}
          className="h-10 flex-1 rounded-lg border border-gray-200 px-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          spellCheck={false}
        />
      </div>

      <Button size="sm" className="w-full" onClick={onApply}>
        Apply
      </Button>
    </div>
  );
}
