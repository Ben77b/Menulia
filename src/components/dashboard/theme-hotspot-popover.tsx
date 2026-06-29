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

function isHotspotTrigger(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest('[class*="group/hotspot"]') ||
      target.closest('[aria-label^="Edit "]') ||
      target.closest('input[type="color"]')
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
    setAdvancedOpen(false);
  }, [group.hotspot]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target;
      if (popoverRef.current?.contains(target as Node)) return;
      if (isHotspotTrigger(target)) return;
      onClose();
    }

    document.addEventListener("click", handleClickOutside, true);
    return () => document.removeEventListener("click", handleClickOutside, true);
  }, [onClose]);

  const handleDone = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onClose();
  };

  return (
    <div
      ref={popoverRef}
      className={cn(
        "absolute z-50 w-80 rounded-2xl border border-[#E5E5EA] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.08)]",
        "animate-in fade-in zoom-in-95 duration-150"
      )}
      style={{ top: position.top, left: position.left }}
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${group.title} colours`}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-2 border-b border-[#F5F5F7] px-4 py-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[#86868B]">Edit colours</p>
          <p className="text-sm font-semibold text-slate-900">{group.title}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-[#86868B]">
            Changes apply instantly. Parent colour resets fine-tuned children.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close colour editor"
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
            <div className="max-h-64 divide-y divide-[#F5F5F7] overflow-y-auto border-t border-[#F5F5F7] bg-[#FAFAFA]/80 px-4 py-2">
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
        <Button type="button" size="sm" className="w-full" onClick={handleDone}>
          Done
        </Button>
      </div>
    </div>
  );
}
