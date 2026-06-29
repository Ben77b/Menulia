"use client";

import type { CSSProperties, ReactNode } from "react";
import type { ResolvedMenuTheme } from "@/lib/advanced-theme";
import { resolvedThemeToPreviewCssProperties } from "@/lib/preview-theme-vars";
import { PreviewCanvasProvider } from "@/contexts/preview-canvas-context";

interface MenuPhonePreviewProps {
  children: ReactNode;
  label?: string;
  className?: string;
  /** Resolved theme — mapped to CSS variables on the canvas root for instant hotspot updates */
  previewTheme?: ResolvedMenuTheme;
  /** Enable CSS-variable driven styling inside the canvas */
  previewCanvas?: boolean;
}

export function MenuPhonePreview({
  children,
  label = "Live Preview",
  className = "",
  previewTheme,
  previewCanvas = false,
}: MenuPhonePreviewProps) {
  const canvasStyle: CSSProperties | undefined = previewTheme
    ? resolvedThemeToPreviewCssProperties(previewTheme)
    : undefined;

  return (
    <div
      className={`flex flex-col items-center justify-start rounded-xl border border-border bg-gradient-to-b from-muted to-background p-4 lg:p-6 ${className}`}
    >
      <p className="mb-4 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <div className="relative w-full max-w-[390px] shrink-0">
        <div className="overflow-hidden rounded-[2.75rem] border-[10px] border-gray-900 bg-gray-900 shadow-2xl">
          <div className="flex items-center justify-center bg-gray-900 py-2">
            <div className="h-1 w-16 rounded-full bg-gray-700" />
          </div>
          <PreviewCanvasProvider enabled={previewCanvas}>
            <div
              className="menu-preview-canvas h-[720px] overflow-y-auto"
              style={{
                ...canvasStyle,
                backgroundColor: previewCanvas
                  ? "var(--preview-menu-bg, #ffffff)"
                  : "#ffffff",
              }}
              data-preview-canvas={previewCanvas ? "true" : undefined}
            >
              {children}
            </div>
          </PreviewCanvasProvider>
          <div className="flex items-center justify-center bg-gray-900 py-3">
            <div className="h-1 w-28 rounded-full bg-gray-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
