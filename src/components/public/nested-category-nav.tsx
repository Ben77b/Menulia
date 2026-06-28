"use client";

import { useEffect, useMemo } from "react";
import { contrastingTextColor } from "@/lib/contrast";
import type { PublicMenuParentCategory } from "@/lib/menu-hierarchy";

interface NestedCategoryNavProps {
  menu: PublicMenuParentCategory[];
  headerBackgroundColor: string;
  stripBackgroundColor: string;
  accentColor: string;
  activeParentId: string;
  activeSubcategoryId: string;
  showTier1: boolean;
  onParentChange: (parentId: string) => void;
  onSubcategoryChange: (subcategoryId: string) => void;
}

export function NestedCategoryNav({
  menu,
  headerBackgroundColor,
  stripBackgroundColor,
  accentColor,
  activeParentId,
  activeSubcategoryId,
  showTier1,
  onParentChange,
  onSubcategoryChange,
}: NestedCategoryNavProps) {
  const tier1Text = contrastingTextColor(headerBackgroundColor);
  const tier2Text = contrastingTextColor(stripBackgroundColor);
  const accentFillText = contrastingTextColor(accentColor);

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

  return (
    <div className="w-full">
      {showTier1 && (
        <nav
          className="flex w-full flex-wrap items-center justify-center gap-2 px-4 py-4"
          style={{
            backgroundColor: headerBackgroundColor,
            color: tier1Text,
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
                        backgroundColor: tier1Text,
                        color: headerBackgroundColor,
                        border: `1px solid ${tier1Text}`,
                        textAlign: "center",
                      }
                    : {
                        backgroundColor: "transparent",
                        color: tier1Text,
                        border: `1px solid ${tier1Text}`,
                        textAlign: "center",
                      }
                }
              >
                {parent.name}
              </button>
            );
          })}
        </nav>
      )}

      {showTier2 && (
        <nav
          className="flex w-full flex-wrap items-center justify-center gap-2 border-b border-black/5 px-4 py-4"
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
                        backgroundColor: accentColor,
                        color: accentFillText,
                        border: `1px solid ${accentColor}`,
                        textAlign: "center",
                      }
                    : {
                        backgroundColor: "transparent",
                        color: tier2Text,
                        border: `1px solid ${tier2Text}`,
                        textAlign: "center",
                      }
                }
              >
                {subcategory.name}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
