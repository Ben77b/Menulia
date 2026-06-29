"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ThemeHotspotGroup } from "@/lib/theme-inheritance";
import type { AdvancedTheme } from "@/lib/advanced-theme";
import { ThemeColorFieldCard } from "@/components/dashboard/theme-color-field-card";
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
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">{group.title}</h3>
      </div>

      <div className="border-b border-gray-100 p-4">
        <ThemeColorFieldCard
          label={group.parentLabel}
          description={group.parentDescription}
          value={parentColor}
          fallback="#ffffff"
          onChange={onParentChange}
          variant="sidebar"
        />
      </div>

      {group.childFields.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setAdvancedOpen((open) => !open)}
            className="flex w-full items-center justify-between border-b border-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
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
            <div className="space-y-3 bg-gray-50/50 p-4">
              {group.childFields.map((child) => (
                <ThemeColorFieldCard
                  key={child.id}
                  label={child.label}
                  description={child.description}
                  value={getChildColor(child.id)}
                  fallback={parentColor}
                  onChange={(color) => onChildChange(child.id, color)}
                  inherited={!isChildOverridden(child.id)}
                  variant="sidebar"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
