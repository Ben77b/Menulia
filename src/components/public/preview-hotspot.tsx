"use client";

import { cn } from "@/lib/utils";
import type { ThemeHotspotId } from "@/lib/advanced-theme";

interface PreviewHotspotProps {
  id: ThemeHotspotId;
  active?: boolean;
  enabled?: boolean;
  onSelect?: (id: ThemeHotspotId) => void;
  className?: string;
  children: React.ReactNode;
}

export function PreviewHotspot({
  id,
  active,
  enabled,
  onSelect,
  className,
  children,
}: PreviewHotspotProps) {
  if (!enabled || !onSelect) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(id);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(id);
        }
      }}
      className={cn(
        "relative cursor-pointer transition-shadow",
        active && "ring-2 ring-indigo-500 ring-offset-2",
        className
      )}
    >
      {children}
    </div>
  );
}
