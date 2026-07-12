"use client";

import { cn } from "@/lib/utils";

export interface CapsuleNavItem<T extends string> {
  id: T;
  label: string;
}

interface CapsuleNavProps<T extends string> {
  items: CapsuleNavItem<T>[];
  active: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
  className?: string;
}

export function CapsuleNav<T extends string>({
  items,
  active,
  onChange,
  ariaLabel = "Sections",
  className,
}: CapsuleNavProps<T>) {
  return (
    <nav
      className={cn(
        "flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none snap-x snap-mandatory",
        "air-capsule-nav",
        className
      )}
      aria-label={ariaLabel}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            "air-capsule-nav-item min-h-11 snap-start rounded-xl px-4 py-2 text-sm font-medium",
            active === item.id && "air-capsule-nav-item-active"
          )}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
