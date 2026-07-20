"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { normalizeHexColor } from "@/lib/theme-colors";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ThemePickerField } from "@/lib/advanced-theme";
import type { BasicColorField } from "@/lib/theme-color-fields";

const BASIC_FIELD_LABELS: Record<BasicColorField, string> = {
  headerNavBg: "Header & Navigation Background",
  headerBackgroundColor: "Header Background",
  categoryStripBackgroundColor: "Category Bar Background",
  categoryAccentColor: "Category Accent",
  mainContentBackgroundColor: "Main Content Background",
  footerBackgroundColor: "Footer Background",
};

interface HotspotColorField {
  id: string;
  label: string;
  color: string;
  fallback: string;
  onChange: (color: string) => void;
}

interface HotspotColorPopoverProps {
  title: string;
  fields: HotspotColorField[];
  position: { top: number; left: number };
  onApply: () => void;
  onClose: () => void;
}

export function HotspotColorPopover({
  title,
  fields,
  position,
  onApply,
  onClose,
}: HotspotColorPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [onClose]);

  return (
    <div
      ref={popoverRef}
      className={cn(
        "absolute z-30 w-[min(16rem,calc(100vw-1.5rem))] max-w-xs air-card p-4 shadow-xl",
        "animate-in fade-in zoom-in-95 duration-150"
      )}
      style={{
        top: position.top,
        left: position.left,
      }}
      role="dialog"
      aria-label={`Edit ${title} colours`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Edit colours</p>
          <p className="truncate text-sm font-semibold text-neutral-900">{title}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
        {fields.map((field) => {
          const safeColor = normalizeHexColor(field.color, field.fallback);
          return (
            <div key={field.id}>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">{field.label}</label>
              <div className="flex items-center gap-2">
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-[10px] border border-border shadow-sm">
                  <input
                    type="color"
                    value={safeColor}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer border-0 p-0"
                  />
                </div>
                <input
                  type="text"
                  value={safeColor}
                  onChange={(e) => {
                    const next = e.target.value.trim();
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(next)) {
                      field.onChange(next.length === 7 ? next : safeColor);
                    }
                  }}
                  className="air-input h-9 flex-1 px-2 font-mono text-xs"
                  spellCheck={false}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Button size="sm" className="mt-4 w-full" onClick={onApply}>
        Apply
      </Button>
    </div>
  );
}

export function buildAdvancedHotspotFields(
  pickerFields: ThemePickerField[],
  getColor: (id: ThemePickerField["id"]) => string,
  setColor: (id: ThemePickerField["id"], value: string) => void,
  getFallback: (field: ThemePickerField) => string
): HotspotColorField[] {
  return pickerFields.map((field) => ({
    id: field.id,
    label: field.label,
    color: getColor(field.id),
    fallback: getFallback(field),
    onChange: (value) => setColor(field.id, value),
  }));
}

export function buildBasicHotspotFields(
  fieldIds: BasicColorField[],
  getColor: (id: BasicColorField) => string,
  setColor: (id: BasicColorField, value: string) => void
): HotspotColorField[] {
  return fieldIds.map((id) => ({
    id,
    label: BASIC_FIELD_LABELS[id],
    color: getColor(id),
    fallback: "#ffffff",
    onChange: (value) => setColor(id, value),
  }));
}
