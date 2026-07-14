"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MenuBuilderCategory, MenuBuilderSection } from "@/lib/menu-builder-types";
import { MAX_CATEGORIES_PER_SECTION, MAX_CATEGORY_NAME } from "@/lib/menu-limits";
import { resolveBuilderSourceText } from "@/lib/localized-text";
import type { MenuContentLanguage } from "@/lib/menu-content-languages";
import { ReorderButtons } from "./reorder-buttons";

export function CategoryListPanel({
  activeSection,
  activeCategoryId,
  primaryLanguage,
  busy,
  reorderMode,
  addingCategory,
  newCategoryName,
  onSelectCategory,
  onNewCategoryNameChange,
  onStartAddCategory,
  onCancelAddCategory,
  onAddCategory,
  onMoveCategory,
  className,
}: {
  activeSection: MenuBuilderSection;
  activeCategoryId: string | null;
  primaryLanguage: MenuContentLanguage;
  busy: boolean;
  reorderMode: boolean;
  addingCategory: boolean;
  newCategoryName: string;
  onSelectCategory: (categoryId: string) => void;
  onNewCategoryNameChange: (value: string) => void;
  onStartAddCategory: () => void;
  onCancelAddCategory: () => void;
  onAddCategory: () => void;
  onMoveCategory: (categoryId: string, direction: -1 | 1) => void;
  className?: string;
}) {
  const categories = (activeSection.categories ?? []).filter(
    (category): category is MenuBuilderCategory => Boolean(category?.id)
  );

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="border-b border-neutral-200/60 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
          Categories
        </p>
      </div>
      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-2">
        {categories.map((category, index) => {
          const isActive = category.id === activeCategoryId;
          const label = resolveBuilderSourceText(category.name, primaryLanguage) || "Category";
          return (
            <li key={category.id}>
              <div className="group flex items-center gap-1">
                <ReorderButtons
                  revealOnHover
                  mobileEnabled={reorderMode}
                  onMoveUp={() => onMoveCategory(category.id, -1)}
                  onMoveDown={() => onMoveCategory(category.id, 1)}
                  canMoveUp={index > 0}
                  canMoveDown={index < categories.length - 1}
                  disabled={busy}
                />
                <button
                  type="button"
                  onClick={() => onSelectCategory(category.id)}
                  className={cn(
                    "flex min-h-11 flex-1 items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200 ease-in-out",
                    isActive
                      ? "border border-sky-200/80 bg-sky-50 text-sky-900"
                      : "border border-transparent text-neutral-700 hover:bg-neutral-50"
                  )}
                >
                  <span className="truncate font-medium">{label}</span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums",
                      isActive ? "bg-sky-100 text-sky-700" : "bg-neutral-100 text-neutral-500"
                    )}
                  >
                    {category.dishes?.length ?? 0}
                  </span>
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="shrink-0 border-t border-neutral-200/60 p-3">
        {addingCategory ? (
          <div className="space-y-2">
            <input
              autoFocus
              placeholder="Category name"
              value={newCategoryName}
              maxLength={MAX_CATEGORY_NAME}
              onChange={(e) => onNewCategoryNameChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onAddCategory()}
              className="w-full rounded-xl border border-neutral-200/60 bg-white px-3 py-2 text-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200/80"
            />
            <div className="flex gap-2">
              <Button
                variant="dark"
                size="sm"
                className="min-h-11 flex-1"
                onClick={onAddCategory}
                disabled={!newCategoryName.trim() || busy}
              >
                Add
              </Button>
              <Button variant="outline" size="sm" className="min-h-11" onClick={onCancelAddCategory}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onStartAddCategory}
            disabled={busy || categories.length >= MAX_CATEGORIES_PER_SECTION}
            className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-medium text-neutral-500 transition-all duration-200 ease-in-out hover:bg-neutral-50 hover:text-neutral-800 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        )}
      </div>
    </div>
  );
}
