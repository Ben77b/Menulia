"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  ALLERGEN_TAG_OPTIONS,
  getAllergenEditorLabel,
} from "@/lib/dietary-tags";

interface AllergenPopoverFieldProps {
  selected: string[];
  onToggle: (tag: string) => void;
  disabled?: boolean;
}

export function AllergenPopoverField({
  selected,
  onToggle,
  disabled = false,
}: AllergenPopoverFieldProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeCount = selected.length;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#E5E5EA] bg-white px-4 py-3 text-left transition-colors hover:bg-[#FAFAFA] disabled:opacity-50"
      >
        <span className="text-sm font-medium text-slate-900">
          ⚠️ Alérgenos / Allergens
        </span>
        {activeCount > 0 ? (
          <span className="rounded-full bg-[#F5F5F7] px-2.5 py-0.5 text-xs font-medium text-slate-700">
            {activeCount} seleccionados
          </span>
        ) : (
          <span className="h-2 w-2 rounded-full bg-[#D1D1D6]" aria-label="None selected" />
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl border border-[#E5E5EA] bg-white p-4 shadow-lg">
          <p className="mb-3 text-xs text-[#86868B]">
            Informational only — shown on dish cards, not used for menu filtering.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ALLERGEN_TAG_OPTIONS.map(({ tag }) => {
              const active = selected.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onToggle(tag)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left text-xs font-medium transition-colors",
                    active
                      ? "border-slate-300 bg-[#F5F5F7] text-slate-900"
                      : "border-[#E5E5EA] text-[#86868B] hover:border-slate-300 hover:text-slate-700"
                  )}
                >
                  {getAllergenEditorLabel(tag)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
