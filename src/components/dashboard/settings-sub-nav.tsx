"use client";

import { cn } from "@/lib/utils";

export interface SettingsSubNavItem<T extends string> {
  id: T;
  label: string;
}

interface SettingsSubNavProps<T extends string> {
  items: SettingsSubNavItem<T>[];
  active: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
}

export function SettingsSubNav<T extends string>({
  items,
  active,
  onChange,
  ariaLabel = "Settings sections",
}: SettingsSubNavProps<T>) {
  return (
    <nav className="-mb-px flex gap-1 overflow-x-auto border-b border-gray-200" aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            "whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors sm:px-5",
            active === item.id
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
          )}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
