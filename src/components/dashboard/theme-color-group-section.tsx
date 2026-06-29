"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { normalizeHexColor } from "@/lib/theme-colors";
import type { ThemeHotspotGroup } from "@/lib/theme-inheritance";
import type { AdvancedTheme } from "@/lib/advanced-theme";
import { cn } from "@/lib/utils";

interface ThemeColorGroupSectionProps {
  group: ThemeHotspotGroup;
  parentColor: string;
  onParentChange: (color: string) => void;
  getChildColor: (fieldId: keyof AdvancedTheme) => string;
  onChildChange: (fieldId: keyof AdvancedTheme, color: string) => void;
  isChildOverridden: (fieldId: keyof AdvancedTheme) => boolean;
  defaultExpanded?: boolean;
}

function ColorPickerRow({
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
    <div className="rounded-lg p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {inherited !== undefined && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
              inherited ? "bg-gray-100 text-gray-500" : "bg-indigo-50 text-indigo-700"
            )}
          >
            {inherited ? "Inherited" : "Custom"}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
          <input
            type="color"
            value={safeColor}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer border-0 p-0"
          />
        </div>
        <span className="font-mono text-xs text-gray-600">{safeColor}</span>
      </div>
    </div>
  );
}

export function ThemeColorGroupSection({
  group,
  parentColor,
  onParentChange,
  getChildColor,
  onChildChange,
  isChildOverridden,
  defaultExpanded = false,
}: ThemeColorGroupSectionProps) {
  const [advancedOpen, setAdvancedOpen] = useState(defaultExpanded);

  return (
    <section className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">{group.title}</h3>
      </div>

      <div className="px-1 py-2">
        <ColorPickerRow
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
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
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
            <div className="space-y-1 border-t border-gray-100 bg-gray-50/50 px-1 py-2">
              {group.childFields.map((child) => (
                <ColorPickerRow
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
    </section>
  );
}
