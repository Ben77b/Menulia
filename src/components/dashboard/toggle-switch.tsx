"use client";

import { cn } from "@/lib/utils";

interface ToggleSwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleSwitch({ label, description, checked, onChange }: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#F5F5F7] py-4 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {description && <p className="air-helper mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:ring-offset-2",
          checked ? "bg-slate-900" : "bg-[#E5E5EA]"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-6 w-6 translate-x-0.5 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.15)] transition-transform",
            checked && "translate-x-[1.375rem]"
          )}
        />
      </button>
    </div>
  );
}
