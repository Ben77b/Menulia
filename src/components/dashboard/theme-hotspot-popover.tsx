"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { normalizeHexColor } from "@/lib/theme-colors";
import type { ThemeHotspotGroup } from "@/lib/theme-inheritance";
import type { AdvancedTheme } from "@/lib/advanced-theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeHotspotPopoverProps {
  group: ThemeHotspotGroup;
  parentColor: string;
  onParentChange: (color: string) => void;
  getChildColor: (fieldId: keyof AdvancedTheme) => string;
  onChildChange: (fieldId: keyof AdvancedTheme, color: string) => void;
  isChildOverridden: (fieldId: keyof AdvancedTheme) => boolean;
  position: { top: number; left: number };
  onClose: () => void;
}

function PopoverColorField({
  label,
  value,
  fallback,
  onChange,
  inherited,
}: {
  label: string;
  value: string;
  fallback: string;
  onChange: (color: string) => void;
  inherited?: boolean;
}) {
  const safeColor = normalizeHexColor(value, fallback);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-gray-700">{label}</label>
        {inherited !== undefined && (
          <span
            className={cn(
              "text-[10px] font-medium uppercase tracking-wide",
              inherited ? "text-gray-400" : "text-indigo-600"
            )}
          >
            {inherited ? "Inherited" : "Custom"}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
          <input
            type="color"
            value={safeColor}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer border-0 p-0"
          />
        </div>
        <input
          type="text"
          value={safeColor}
          onChange={(e) => {
            const next = e.target.value.trim();
            if (/^#[0-9A-Fa-f]{0,6}$/.test(next)) {
              onChange(next.length === 7 ? next : safeColor);
            }
          }}
          className="h-9 flex-1 rounded-lg border border-gray-200 px-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          spellCheck={false}
        />
      </div>
    </div>
  );
}

export function ThemeHotspotPopover({
  group,
  parentColor,
  onParentChange,
  getChildColor,
  onChildChange,
  isChildOverridden,
  position,
  onClose,
}: ThemeHotspotPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

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
        "absolute z-50 w-72 rounded-xl border border-gray-200 bg-white shadow-xl",
        "animate-in fade-in zoom-in-95 duration-150"
      )}
      style={{ top: position.top, left: position.left }}
      role="dialog"
      aria-label={`Edit ${group.title} colours`}
    >
      <div className="flex items-start justify-between gap-2 border-b border-gray-100 px-4 py-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Edit colours</p>
          <p className="text-sm font-semibold text-gray-900">{group.title}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 py-3">
        <PopoverColorField
          label={group.parentLabel}
          value={parentColor}
          fallback="#ffffff"
          onChange={onParentChange}
        />
      </div>

      {group.childFields.length > 0 && (
        <div className="border-t border-gray-100">
          <button
            type="button"
            onClick={() => setAdvancedOpen((open) => !open)}
            className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
            aria-expanded={advancedOpen}
          >
            <span>Advanced / Fine-tune Section</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-gray-400 transition-transform",
                advancedOpen && "rotate-180"
              )}
            />
          </button>

          {advancedOpen && (
            <div className="max-h-52 space-y-3 overflow-y-auto border-t border-gray-100 bg-gray-50/60 px-4 py-3">
              {group.childFields.map((child) => (
                <PopoverColorField
                  key={child.id}
                  label={child.label}
                  value={getChildColor(child.id)}
                  fallback={parentColor}
                  onChange={(color) => onChildChange(child.id, color)}
                  inherited={!isChildOverridden(child.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-gray-100 px-4 py-3">
        <Button size="sm" className="w-full" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}
