"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getMenuContentLanguageMeta,
  getSecondaryLanguage,
  type MenuContentLanguage,
} from "@/lib/menu-content-languages";

const fieldInputClassName =
  "h-11 w-full rounded-xl border border-[#E5E5EA] bg-white px-4 text-sm text-slate-900 transition-all placeholder:text-[#86868B] focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:opacity-50";

interface SecondaryLanguageFieldProps {
  primaryLanguage: MenuContentLanguage;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void | Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  multiline?: boolean;
  label: string;
}

export function SecondaryLanguageField({
  primaryLanguage,
  value,
  onChange,
  onSave,
  disabled = false,
  placeholder,
  multiline = false,
  label,
}: SecondaryLanguageFieldProps) {
  const secondaryLanguage = getSecondaryLanguage(primaryLanguage);
  const secondaryMeta = getMenuContentLanguageMeta(secondaryLanguage);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!popoverOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!popoverRef.current?.contains(event.target as Node)) {
        setPopoverOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [popoverOpen]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative inline-flex" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setPopoverOpen((open) => !open)}
        disabled={disabled}
        aria-label={`Manage ${secondaryMeta.label} translation for ${label}`}
        aria-expanded={popoverOpen}
        className={cn(
          "rounded-lg p-1 transition-colors hover:bg-[#F5F5F7] disabled:opacity-40",
          value.trim() ? "text-slate-600" : "text-[#C7C7CC] hover:text-slate-600"
        )}
      >
        <Globe className="h-3.5 w-3.5" />
      </button>

      {popoverOpen && (
        <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-2xl border border-[#E5E5EA] bg-white p-4 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {secondaryMeta.label} ({secondaryLanguage.toUpperCase()})
          </p>
          <div className="relative mt-2">
            {multiline ? (
              <textarea
                value={value}
                disabled={disabled || saving}
                onChange={(event) => onChange(event.target.value)}
                onBlur={() => void handleSave()}
                placeholder={placeholder ?? `${secondaryMeta.label} ${label.toLowerCase()}`}
                className={cn(fieldInputClassName, "min-h-[88px] resize-none py-2")}
              />
            ) : (
              <input
                value={value}
                disabled={disabled || saving}
                onChange={(event) => onChange(event.target.value)}
                onBlur={() => void handleSave()}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleSave();
                    setPopoverOpen(false);
                  }
                  if (event.key === "Escape") setPopoverOpen(false);
                }}
                placeholder={placeholder ?? `${secondaryMeta.label} ${label.toLowerCase()}`}
                className={fieldInputClassName}
              />
            )}
            {saving && (
              <Loader2 className="pointer-events-none absolute right-3 top-3 h-4 w-4 animate-spin text-slate-400" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
