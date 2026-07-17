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
      className={cn("air-capsule-nav", className)}
      aria-label={ariaLabel}
      role="tablist"
    >
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={cn(
              "air-capsule-nav-item",
              isActive && "air-capsule-nav-item-active"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
