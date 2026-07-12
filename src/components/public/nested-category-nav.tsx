"use client";

import { useEffect, useMemo } from "react";
import { contrastingTextColor, subtleDividerColor } from "@/lib/contrast";
import { usePreviewCanvas } from "@/contexts/preview-canvas-context";
import { pv } from "@/lib/preview-theme-vars";
import type { PublicMenuParentCategory } from "@/lib/menu-hierarchy";
import { resolveLocalizedText } from "@/lib/localized-text";

interface NestedCategoryNavProps {
  menu: PublicMenuParentCategory[];
  stripBackgroundColor: string;
  tier1ActiveBg: string;
  tier1ActiveText: string;
  tier1ActiveBorder: string;
  tier1InactiveBg: string;
  tier1InactiveText: string;
  tier1InactiveBorder: string;
  tier2ActiveBg: string;
  tier2ActiveText: string;
  tier2ActiveBorder: string;
  tier2InactiveBg: string;
  tier2InactiveText: string;
  tier2InactiveBorder: string;
  categoryFont: string;
  categoryFontWeight?: number;
  categoryFontStyle?: "normal" | "italic";
  activeParentId: string;
  activeSubcategoryId: string;
  lang?: string;
  fallbackLang?: string;
  showTier1: boolean;
  onParentChange: (parentId: string) => void;
  onSubcategoryChange: (subcategoryId: string) => void;
}

export function NestedCategoryNav({
  menu,
  stripBackgroundColor,
  tier1ActiveBg,
  tier1ActiveText,
  tier1ActiveBorder,
  tier1InactiveBg,
  tier1InactiveText,
  tier1InactiveBorder,
  tier2ActiveBg,
  tier2ActiveText,
  tier2ActiveBorder,
  tier2InactiveBg,
  tier2InactiveText,
  tier2InactiveBorder,
  categoryFont,
  categoryFontWeight,
  categoryFontStyle,
  activeParentId,
  activeSubcategoryId,
  lang = "en",
  fallbackLang = "en",
  showTier1,
  onParentChange,
  onSubcategoryChange,
}: NestedCategoryNavProps) {
  const isPreview = usePreviewCanvas();
  const tier2Text = isPreview ? pv("inactiveTabText") : contrastingTextColor(stripBackgroundColor);
  const categoryTypeStyle = {
    fontFamily: categoryFont,
    fontWeight: categoryFontWeight ?? 400,
    fontStyle: categoryFontStyle ?? "normal",
  } as const;

  const activeParent = useMemo(
    () => menu.find((parent) => parent.id === activeParentId) ?? menu[0],
    [menu, activeParentId]
  );

  const subcategories = activeParent?.subcategories ?? [];
  const showTier2 = subcategories.length > 1 || (showTier1 && subcategories.length > 0);

  useEffect(() => {
    if (!activeParent) return;
    const stillValid = subcategories.some((sub) => sub.id === activeSubcategoryId);
    if (!stillValid && subcategories[0]) {
      onSubcategoryChange(subcategories[0].id);
    }
  }, [activeParent, activeSubcategoryId, onSubcategoryChange, subcategories]);

  if (menu.length === 0) return null;

  const tierDividerColor = isPreview
    ? "var(--preview-divider, rgba(0, 0, 0, 0.1))"
    : subtleDividerColor(stripBackgroundColor);

  return (
    <div
      className="w-full border-b border-black/5"
      style={{ backgroundColor: stripBackgroundColor }}
    >
      {showTier1 && (
        <nav
          className="flex w-full flex-wrap items-center justify-center gap-2 px-4 py-4"
          style={{
            backgroundColor: stripBackgroundColor,
            color: tier2Text,
            justifyContent: "center",
          }}
        >
          {menu.map((parent) => {
            const isActive = parent.id === activeParentId;
            return (
              <button
                key={parent.id}
                type="button"
                onClick={() => onParentChange(parent.id)}
                className="rounded-full px-5 py-2 text-center text-xs font-semibold uppercase tracking-[0.15em] transition-colors duration-200 sm:text-sm"
                style={
                  isActive
                    ? {
                        ...categoryTypeStyle,
                        backgroundColor: tier1ActiveBg,
                        color: tier1ActiveText,
                        border: `1px solid ${tier1ActiveBorder}`,
                        textAlign: "center",
                      }
                    : {
                        ...categoryTypeStyle,
                        backgroundColor: tier1InactiveBg,
                        color: tier1InactiveText,
                        border: `1px solid ${tier1InactiveBorder}`,
                        textAlign: "center",
                      }
                }
              >
                {resolveLocalizedText(parent.name, lang, fallbackLang)}
              </button>
            );
          })}
        </nav>
      )}

      {showTier1 && showTier2 && (
        <div
          className="mx-4"
          style={{ borderTop: `1px solid ${tierDividerColor}` }}
          aria-hidden
        />
      )}

      {showTier2 && (
        <nav
          className="flex w-full flex-wrap items-center justify-center gap-2 px-4 py-3"
          style={{
            backgroundColor: stripBackgroundColor,
            color: tier2Text,
            justifyContent: "center",
          }}
        >
          {subcategories.map((subcategory) => {
            const isActive = subcategory.id === activeSubcategoryId;
            return (
              <button
                key={subcategory.id}
                type="button"
                onClick={() => onSubcategoryChange(subcategory.id)}
                className="rounded-full px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-200 sm:text-sm"
                style={
                  isActive
                    ? {
                        ...categoryTypeStyle,
                        backgroundColor: tier2ActiveBg,
                        color: tier2ActiveText,
                        border: `1px solid ${tier2ActiveBorder}`,
                        textAlign: "center",
                      }
                    : {
                        ...categoryTypeStyle,
                        backgroundColor: tier2InactiveBg,
                        color: tier2InactiveText,
                        border: `1px solid ${tier2InactiveBorder}`,
                        textAlign: "center",
                      }
                }
              >
                {resolveLocalizedText(subcategory.name, lang, fallbackLang)}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
