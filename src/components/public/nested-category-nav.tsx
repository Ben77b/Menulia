"use client";

import { useEffect, useMemo, useState } from "react";
import { contrastingTextColor } from "@/lib/contrast";
import type { PublicMenuParentCategory } from "@/lib/menu-hierarchy";

interface NestedCategoryNavProps {
  menu: PublicMenuParentCategory[];
  headerBackgroundColor: string;
  stripBackgroundColor: string;
  accentColor: string;
  activeParentId: string;
  activeSubcategoryId: string;
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
  const showTier2 = subcategories.length > 1;

  useEffect(() => {
    if (!activeParent) return;
    const stillValid = subcategories.some((sub) => sub.id === activeSubcategoryId);
    if (!stillValid && subcategories[0]) {
      onSubcategoryChange(subcategories[0].id);
    }
  }, [activeParent, activeSubcategoryId, onSubcategoryChange, subcategories]);

  if (menu.length === 0) return null;

  return (
    <div className="sticky top-[72px] z-40">
      <nav
        className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide sm:justify-center"
        style={{ backgroundColor: headerBackgroundColor, color: tier1Text }}
      >
        {menu.map((parent) => {
          const isActive = parent.id === activeParentId;
          return (
            <button
              key={parent.id}
              type="button"
              onClick={() => onParentChange(parent.id)}
              className="whitespace-nowrap rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] transition-colors duration-200 sm:text-sm"
              style={
                isActive
                  ? {
                      backgroundColor: tier1Text,
                      color: headerBackgroundColor,
                      border: `1px solid ${tier1Text}`,
                    }
                  : {
                      backgroundColor: "transparent",
                      color: tier1Text,
                      border: `1px solid ${tier1Text}`,
                    }
              }
            >
              {parent.name}
            </button>
          );
        })}
      </nav>

      {showTier2 && (
        <nav
          className="flex flex-wrap justify-center gap-2 border-b border-black/5 px-4 py-3 md:flex-nowrap md:overflow-x-auto md:justify-start"
          style={{ backgroundColor: stripBackgroundColor, color: tier2Text }}
        >
          {subcategories.map((subcategory) => {
            const isActive = subcategory.id === activeSubcategoryId;
            return (
              <button
                key={subcategory.id}
                type="button"
                onClick={() => onSubcategoryChange(subcategory.id)}
                className="whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-200 sm:text-sm"
                style={
                  isActive
                    ? {
                        backgroundColor: accentColor,
                        color: accentFillText,
                        border: `1px solid ${accentColor}`,
                      }
                    : {
                        backgroundColor: "transparent",
                        color: tier2Text,
                        border: `1px solid ${tier2Text}`,
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
