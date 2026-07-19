"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardLocale } from "@/contexts/dashboard-locale-context";
import { ALLERGEN_TAG_OPTIONS, getAllergenLabel } from "@/lib/dietary-tags";

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
  const { locale, t } = useDashboardLocale();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeCount = selected.length;
  const allergenLocale = locale === "es" ? "es" : "en";

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

  const selectionLabel =
    activeCount === 0
      ? t("allergens.select")
      : activeCount === 1
        ? t("allergens.selectedOne")
        : t("allergens.selectedMany", { count: activeCount });

  return (
    <div className="relative" ref={containerRef}>
      <label className="air-label mb-1.5 block">{t("allergens.label")}</label>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm transition-all",
          "hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0 text-slate-400" />
          <span className={cn("truncate", activeCount === 0 && "text-slate-400")}>{selectionLabel}</span>
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
          <p className="mb-3 px-1 text-xs font-medium uppercase tracking-wide text-slate-400">
            {t("allergens.euTitle")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {ALLERGEN_TAG_OPTIONS.map(({ tag, icon }) => {
              const checked = selected.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onToggle(tag)}
                  className={cn(
                    "flex min-h-11 items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left text-xs transition-all duration-200",
                    checked
                      ? "scale-[1.02] border-indigo-300 bg-indigo-50/80 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base transition-all",
                      checked ? "bg-white shadow-sm ring-1 ring-indigo-200" : "bg-slate-50"
                    )}
                    aria-hidden
                  >
                    {icon}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate leading-tight",
                      checked ? "font-medium text-indigo-900" : "text-slate-700"
                    )}
                  >
                    {getAllergenLabel(tag, allergenLocale)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
