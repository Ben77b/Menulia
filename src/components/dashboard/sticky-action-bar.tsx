import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StickyActionBarProps {
  children: ReactNode;
  className?: string;
}

export function StickyActionBar({ children, className }: StickyActionBarProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 mt-auto border-t border-border/50 bg-white/90 px-5 py-4 backdrop-blur-md",
        className
      )}
    >
      <div className="flex items-center justify-end gap-3">{children}</div>
    </div>
  );
}
