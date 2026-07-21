"use client";

import { normalizeHexColor } from "@/lib/theme-colors";
import { cn } from "@/lib/utils";

interface ThemeColorFieldCardProps {
  label: string;
  description: string;
  value: string;
  fallback: string;
  onChange: (color: string) => void;
  inherited?: boolean;
  variant?: "sidebar" | "popover";
}

export function ThemeColorFieldCard({
  label,
  description,
  value,
  fallback,
  onChange,
  inherited,
  variant = "sidebar",
}: ThemeColorFieldCardProps) {
  const safeColor = normalizeHexColor(value, fallback);
  const isPopover = variant === "popover";

  return (
    <div
      className={cn(
        "rounded-xl border border-neutral-200/40 bg-white",
        isPopover ? "p-3" : "p-4 air-row-divider"
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={cn("font-medium text-slate-900", isPopover ? "text-xs" : "text-sm")}>
            {label}
          </p>
          <p
            className={cn(
              "mt-0.5 text-[#86868B]",
              isPopover ? "text-[11px] leading-snug" : "text-xs leading-relaxed"
            )}
          >
            {description}
          </p>
        </div>
        {inherited !== undefined && (
          <span className={cn("air-badge shrink-0", !inherited && "air-badge-active")}>
            {inherited ? "Inherited" : "Custom"}
          </span>
        )}
      </div>

      <label className="flex min-w-0 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 transition-all hover:border-slate-300 hover:shadow-sm focus-within:ring-2 focus-within:ring-slate-900/10">
        <span
          className={cn(
            "relative shrink-0 overflow-hidden rounded-xl border border-slate-200 shadow-inner",
            isPopover ? "h-10 w-10" : "h-14 w-14"
          )}
          style={{ backgroundColor: safeColor }}
          aria-hidden
        />
        <input
          type="color"
          value={safeColor}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
          aria-label={label}
        />

        {isPopover ? (
          <input
            type="text"
            value={safeColor}
            onChange={(e) => {
              const next = e.target.value.trim();
              if (/^#[0-9A-Fa-f]{0,6}$/.test(next)) {
                onChange(next.length === 7 ? next : safeColor);
              }
            }}
            className="air-input h-9 min-w-0 flex-1 font-mono text-xs"
            spellCheck={false}
            aria-label={`${label} hex value`}
          />
        ) : (
          <span className="min-w-0 truncate font-mono text-xs text-slate-500">{safeColor}</span>
        )}
      </label>
    </div>
  );
}
