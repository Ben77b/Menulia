"use client";

import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ThemeHotspotId } from "@/lib/advanced-theme";

interface PreviewHotspotProps {
  id: ThemeHotspotId;
  active?: boolean;
  enabled?: boolean;
  onSelect?: (id: ThemeHotspotId, anchor: DOMRect) => void;
  className?: string;
  /** Position of the circular edit indicator */
  indicatorPosition?: "top-right" | "top-left" | "center-right" | "center-left" | "bottom-right";
  children: React.ReactNode;
}

const INDICATOR_POSITION: Record<
  NonNullable<PreviewHotspotProps["indicatorPosition"]>,
  string
> = {
  "top-right": "right-3 top-3",
  "top-left": "left-3 top-3",
  "center-right": "right-3 top-1/2 -translate-y-1/2",
  "center-left": "left-3 top-1/2 -translate-y-1/2",
  "bottom-right": "bottom-3 right-3",
};

export function PreviewHotspot({
  id,
  active,
  enabled,
  onSelect,
  className,
  indicatorPosition = "top-right",
  children,
}: PreviewHotspotProps) {
  if (!enabled || !onSelect) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={cn(
        "group/hotspot relative",
        active && "z-10 ring-2 ring-slate-900 ring-offset-2",
        className
      )}
    >
      {children}

      <button
        type="button"
        aria-label={`Edit ${id} colors`}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(id, event.currentTarget.getBoundingClientRect());
        }}
        className={cn(
          "absolute z-20 flex h-8 w-8 items-center justify-center rounded-full",
          "border-2 border-white bg-slate-900 text-white shadow-lg",
          "transition-transform hover:scale-110 hover:bg-slate-800",
          "animate-pulse group-hover/hotspot:animate-none",
          active && "scale-110 bg-slate-800 ring-2 ring-slate-300",
          INDICATOR_POSITION[indicatorPosition]
        )}
      >
        <Palette className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>

      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-sm border-2 border-dashed border-slate-400/0",
          "transition-colors group-hover/hotspot:border-slate-400/60",
          active && "border-slate-600/80"
        )}
      />
    </div>
  );
}
