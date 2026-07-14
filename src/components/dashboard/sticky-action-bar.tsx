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
        "sticky bottom-0 z-10 mt-auto border-t border-neutral-200/50 bg-white/90 px-4 py-4 backdrop-blur-md",
        "max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-50",
        className
      )}
    >
      <div className="flex items-center justify-end gap-3">{children}</div>
    </div>
  );
}
