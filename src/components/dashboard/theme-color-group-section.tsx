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
    <section className="air-card overflow-hidden">
      <div className="border-b border-[#F5F5F7] px-5 py-4">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900">{group.title}</h3>
        <p className="mt-0.5 text-xs text-[#86868B]">{group.parentDescription}</p>
      </div>

      <div className="border-b border-[#F5F5F7] p-4">
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
            className="flex w-full items-center justify-between border-b border-[#F5F5F7] px-5 py-3.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-[#FAFAFA]"
            aria-expanded={advancedOpen}
          >
            <span>Advanced / Fine-tune Section</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-[#86868B] transition-transform",
                advancedOpen && "rotate-180"
              )}
            />
          </button>

          {advancedOpen && (
            <div className="divide-y divide-[#F5F5F7] bg-[#FAFAFA]/80 p-4">
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
