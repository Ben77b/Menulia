"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ToggleSwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void | Promise<void>;
  disabled?: boolean;
}

export function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: ToggleSwitchProps) {
  const [visual, setVisual] = useState(checked);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!pending) {
      setVisual(checked);
    }
  }, [checked, pending]);

  async function handleToggle() {
    if (disabled || pending) return;

    const next = !visual;
    setVisual(next);
    setPending(true);

    try {
      await onChange(next);
    } catch {
      setVisual(!next);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-5 border-b border-[#F5F5F7] py-5 last:border-b-0">
      <div className="min-w-0 flex-1 pr-2">
        <p className="text-sm font-medium tracking-tight text-slate-900">{label}</p>
        {description && <p className="air-helper mt-1">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={visual}
        aria-label={label}
        aria-busy={pending}
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          "group -m-3 shrink-0 rounded-full p-3 transition-all duration-200 ease-in-out",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-brand/25 focus-visible:ring-offset-2",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <span
          className={cn(
            "relative flex h-8 w-[3.25rem] items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out",
            visual ? "bg-emerald-brand-dark" : "bg-[#D1D1D6]",
            pending && visual && "bg-emerald-brand"
          )}
        >
          <span
            className={cn(
              "h-7 w-7 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.14)] transition-transform duration-200 ease-in-out will-change-transform",
              visual ? "translate-x-[1.35rem]" : "translate-x-0"
            )}
          />
        </span>
      </button>
    </div>
  );
}
