"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import type { ThemeHotspotGroup } from "@/lib/theme-inheritance";
import type { AdvancedTheme } from "@/lib/advanced-theme";
import { ThemeColorFieldCard } from "@/components/dashboard/theme-color-field-card";
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
        "absolute z-50 w-80 rounded-xl border border-gray-200 bg-white shadow-xl",
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

      <div className="border-b border-gray-100 px-4 py-3">
        <ThemeColorFieldCard
          label={group.parentLabel}
          description={group.parentDescription}
          value={parentColor}
          fallback="#ffffff"
          onChange={onParentChange}
          variant="popover"
        />
      </div>

      {group.childFields.length > 0 && (
        <div className="border-b border-gray-100">
          <button
            type="button"
            onClick={() => setAdvancedOpen((open) => !open)}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
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
            <div className="max-h-64 space-y-2 overflow-y-auto border-t border-gray-100 bg-gray-50/70 px-4 py-3">
              {group.childFields.map((child) => (
                <ThemeColorFieldCard
                  key={child.id}
                  label={child.label}
                  description={child.description}
                  value={getChildColor(child.id)}
                  fallback={parentColor}
                  onChange={(color) => onChildChange(child.id, color)}
                  inherited={!isChildOverridden(child.id)}
                  variant="popover"
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="px-4 py-3">
        <Button size="sm" className="w-full" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}
