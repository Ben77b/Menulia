"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, ChevronRight, LayoutGrid, Layers } from "lucide-react";
import { useRestaurant } from "@/contexts/restaurant-context";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { formatSupabaseError } from "@/lib/auth/errors";
import {
  fetchMenuCategories,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  createMenuDish,
  updateMenuDish,
  deleteMenuDish,
} from "@/lib/menu-db";
import { flatRecordsToMenuTree, countSectionContents } from "@/lib/menu-builder-tree";
import type { MenuBuilderCategory, MenuBuilderDish, MenuBuilderSection } from "@/lib/menu-builder-types";
import { MAX_CATEGORIES_PER_RESTAURANT, MAX_CATEGORY_NAME_LENGTH } from "@/lib/menu-limits";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DishDetailSheet, type DishDetailDraft } from "./dish-detail-sheet";

export function MenuBuilder() {
  const { currentRestaurant, refreshRestaurants } = useRestaurant();
  const [tree, setTree] = useState(flatRecordsToMenuTree([]));
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newSectionName, setNewSectionName] = useState("");
  const [addingSection, setAddingSection] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategoryForSection, setAddingCategoryForSection] = useState<string | null>(null);

  const [rapidDrafts, setRapidDrafts] = useState<Record<string, { name: string; price: string }>>({});
  const [selectedDish, setSelectedDish] = useState<{
    dish: MenuBuilderDish;
    categoryId: string;
  } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const totalCategories = useMemo(() => {
    return (
      tree.sections.length +
      tree.sections.reduce((n, s) => n + s.categories.length, 0) +
      tree.orphanCategories.length
    );
  }, [tree]);

  const activeSection = useMemo(
    () => tree.sections.find((s) => s.id === activeSectionId) ?? tree.sections[0] ?? null,
    [tree, activeSectionId]
  );

  const loadMenu = useCallback(async () => {
    if (!currentRestaurant?.id) return;
    setLoading(true);
    setError(null);
    try {
      const records = await fetchMenuCategories(currentRestaurant.id);
      const nextTree = flatRecordsToMenuTree(records);
      setTree(nextTree);
      setActiveSectionId((prev) => {
        if (prev && nextTree.sections.some((s) => s.id === prev)) return prev;
        return nextTree.sections[0]?.id ?? null;
      });
    } catch (err) {
      console.error(err);
      setError(formatSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }, [currentRestaurant?.id]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  async function handleImageUpload(file: File): Promise<string | null> {
    if (!currentRestaurant?.id) return null;
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type) || file.size > 5 * 1024 * 1024) return null;

    setUploadingImage(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const ext = file.name.split(".").pop();
      const fileName = `${currentRestaurant.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("menu-images")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("menu-images").getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleAddSection() {
    if (!currentRestaurant?.id || !newSectionName.trim()) return;
    if (totalCategories >= MAX_CATEGORIES_PER_RESTAURANT) {
      setError(`Maximum ${MAX_CATEGORIES_PER_RESTAURANT} sections + categories reached.`);
      return;
    }
    setBusy(true);
    try {
      const created = await createMenuCategory(
        newSectionName.trim().slice(0, MAX_CATEGORY_NAME_LENGTH),
        currentRestaurant.id,
        { layout_type: "stacked", parent_id: null }
      );
      await loadMenu();
      setActiveSectionId(created.id);
      setNewSectionName("");
      setAddingSection(false);
      await refreshRestaurants();
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteSection(section: MenuBuilderSection) {
    const { categories, dishes } = countSectionContents(section);
    const message = `Delete section "${section.name}" and all ${categories} categories with ${dishes} dishes? This cannot be undone.`;
    if (!confirm(message)) return;

    setBusy(true);
    try {
      await deleteMenuCategory(section.id);
      await loadMenu();
      await refreshRestaurants();
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleAddCategory(sectionId: string) {
    if (!currentRestaurant?.id || !newCategoryName.trim()) return;
    if (totalCategories >= MAX_CATEGORIES_PER_RESTAURANT) {
      setError(`Maximum ${MAX_CATEGORIES_PER_RESTAURANT} sections + categories reached.`);
      return;
    }
    setBusy(true);
    try {
      await createMenuCategory(
        newCategoryName.trim().slice(0, MAX_CATEGORY_NAME_LENGTH),
        currentRestaurant.id,
        { layout_type: "stacked", parent_id: sectionId }
      );
      setNewCategoryName("");
      setAddingCategoryForSection(null);
      await loadMenu();
      await refreshRestaurants();
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteCategory(category: MenuBuilderCategory) {
    const message = `Delete category "${category.name}" and its ${category.dishes.length} dishes?`;
    if (!confirm(message)) return;

    setBusy(true);
    try {
      await deleteMenuCategory(category.id);
      await loadMenu();
      await refreshRestaurants();
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleRapidAddDish(categoryId: string) {
    const draft = rapidDrafts[categoryId];
    if (!draft?.name.trim()) return;

    setBusy(true);
    try {
      await createMenuDish(
        categoryId,
        draft.name.trim(),
        "",
        parseFloat(draft.price) || 0,
        null,
        []
      );
      setRapidDrafts((prev) => ({ ...prev, [categoryId]: { name: "", price: "" } }));
      await loadMenu();
      await refreshRestaurants();
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveDishDetail(draft: DishDetailDraft) {
    if (!selectedDish) return;
    setBusy(true);
    try {
      await updateMenuDish(
        selectedDish.dish.id,
        draft.name,
        draft.description,
        parseFloat(draft.price) || 0,
        draft.image_url,
        draft.tags
      );
      setSelectedDish(null);
      await loadMenu();
      await refreshRestaurants();
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteDish(dish: MenuBuilderDish, categoryId: string) {
    if (!confirm(`Delete "${dish.name}"?`)) return;
    setBusy(true);
    try {
      await deleteMenuDish(dish.id);
      if (selectedDish?.dish.id === dish.id) setSelectedDish(null);
      await loadMenu();
      await refreshRestaurants();
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleLayoutChange(category: MenuBuilderCategory, layout: "stacked" | "carousel") {
    try {
      await updateMenuCategory(category.id, { layout_type: layout });
      await loadMenu();
    } catch (err) {
      setError(formatSupabaseError(err));
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-sm text-gray-500">
        Loading menu…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Builder</h1>
          <p className="mt-1 text-sm text-gray-600">
            Sections → Categories → Dishes. Tab to price, Enter to save.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => setAddingSection(true)}
          disabled={busy || totalCategories >= MAX_CATEGORIES_PER_RESTAURANT}
        >
          <Plus className="h-4 w-4" />
          Add Section
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {addingSection && (
        <div className="flex gap-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <input
            autoFocus
            placeholder="Section name (e.g. Food, Drinks)"
            value={newSectionName}
            maxLength={MAX_CATEGORY_NAME_LENGTH}
            onChange={(e) => setNewSectionName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddSection()}
            className="h-10 flex-1 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button onClick={handleAddSection} disabled={!newSectionName.trim() || busy}>
            Save
          </Button>
          <Button variant="outline" onClick={() => setAddingSection(false)}>
            Cancel
          </Button>
        </div>
      )}

      {tree.sections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <Layers className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-gray-600">Create your first section to start building the menu tree.</p>
        </div>
      ) : (
        <>
          {/* Tier 1 — Section tabs */}
          <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
            {tree.sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSectionId(section.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  activeSection?.id === section.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
                )}
              >
                {section.name}
                <span className="text-xs opacity-80">({section.categories.length})</span>
              </button>
            ))}
          </div>

          {activeSection && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">{activeSection.name}</h2>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDeleteSection(activeSection)}
                  disabled={busy}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete section
                </Button>
              </div>

              {activeSection.categories.length === 0 ? (
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
                  No categories yet. Add Starters, Mains, Desserts…
                </div>
              ) : (
                activeSection.categories.map((category) => (
                  <CategoryBlock
                    key={category.id}
                    category={category}
                    busy={busy}
                    rapidDraft={rapidDrafts[category.id] ?? { name: "", price: "" }}
                    onRapidDraftChange={(draft) =>
                      setRapidDrafts((prev) => ({ ...prev, [category.id]: draft }))
                    }
                    onRapidAdd={() => handleRapidAddDish(category.id)}
                    onDeleteCategory={() => handleDeleteCategory(category)}
                    onDeleteDish={(dish) => handleDeleteDish(dish, category.id)}
                    onOpenDish={(dish) => setSelectedDish({ dish, categoryId: category.id })}
                    onLayoutChange={(layout) => handleLayoutChange(category, layout)}
                  />
                ))
              )}

              {addingCategoryForSection === activeSection.id ? (
                <div className="flex gap-2 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                  <input
                    autoFocus
                    placeholder="Category name (e.g. Starters)"
                    value={newCategoryName}
                    maxLength={MAX_CATEGORY_NAME_LENGTH}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCategory(activeSection.id)}
                    className="h-10 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Button
                    onClick={() => handleAddCategory(activeSection.id)}
                    disabled={!newCategoryName.trim() || busy}
                  >
                    Add
                  </Button>
                  <Button variant="outline" onClick={() => setAddingCategoryForSection(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingCategoryForSection(activeSection.id)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-3 text-sm font-medium text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50"
                >
                  <Plus className="h-4 w-4" />
                  Add Category
                </button>
              )}
            </div>
          )}
        </>
      )}

      <DishDetailSheet
        open={Boolean(selectedDish)}
        dish={selectedDish?.dish ?? null}
        saving={busy}
        uploadingImage={uploadingImage}
        onClose={() => setSelectedDish(null)}
        onSave={handleSaveDishDetail}
        onImageUpload={handleImageUpload}
      />
    </div>
  );
}

function CategoryBlock({
  category,
  busy,
  rapidDraft,
  onRapidDraftChange,
  onRapidAdd,
  onDeleteCategory,
  onDeleteDish,
  onOpenDish,
  onLayoutChange,
}: {
  category: MenuBuilderCategory;
  busy: boolean;
  rapidDraft: { name: string; price: string };
  onRapidDraftChange: (draft: { name: string; price: string }) => void;
  onRapidAdd: () => void;
  onDeleteCategory: () => void;
  onDeleteDish: (dish: MenuBuilderDish) => void;
  onOpenDish: (dish: MenuBuilderDish) => void;
  onLayoutChange: (layout: "stacked" | "carousel") => void;
}) {
  const priceRef = useRef<HTMLInputElement>(null);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-indigo-500" />
          <h3 className="font-semibold text-gray-900">{category.name}</h3>
          <span className="text-xs text-gray-500">{category.dishes.length} dishes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 bg-white p-0.5 text-xs">
            {(["stacked", "carousel"] as const).map((layout) => (
              <button
                key={layout}
                type="button"
                onClick={() => onLayoutChange(layout)}
                className={cn(
                  "rounded-md px-2 py-1 capitalize",
                  category.layout_type === layout
                    ? "bg-indigo-100 font-medium text-indigo-700"
                    : "text-gray-600"
                )}
              >
                {layout}
              </button>
            ))}
          </div>
          <Button size="sm" variant="ghost" className="text-red-500" onClick={onDeleteCategory}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {category.dishes.map((dish) => (
          <div
            key={dish.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpenDish(dish)}
            onKeyDown={(e) => (e.key === "Enter" ? onOpenDish(dish) : undefined)}
            className="group flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-indigo-50/40"
          >
            {dish.image_url ? (
              <img
                src={dish.image_url}
                alt=""
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-gray-100" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-900">{dish.name}</p>
              {dish.description && (
                <p className="truncate text-xs text-gray-500">{dish.description}</p>
              )}
            </div>
            <p className="font-semibold text-gray-900">€{dish.price.toFixed(2)}</p>
            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-400" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteDish(dish);
              }}
              className="rounded p-1 text-gray-400 opacity-0 hover:text-red-500 group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        {/* Rapid-add row */}
        <div className="flex items-center gap-2 bg-indigo-50/30 px-4 py-3">
          <Plus className="h-4 w-4 shrink-0 text-indigo-400" />
          <input
            placeholder="Dish title"
            value={rapidDraft.name}
            disabled={busy}
            onChange={(e) => onRapidDraftChange({ ...rapidDraft, name: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                priceRef.current?.focus();
              }
            }}
            className="h-9 min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            ref={priceRef}
            placeholder="Price"
            value={rapidDraft.price}
            disabled={busy}
            onChange={(e) => onRapidDraftChange({ ...rapidDraft, price: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onRapidAdd();
              }
            }}
            className="h-9 w-24 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button size="sm" variant="outline" disabled={busy || !rapidDraft.name.trim()} onClick={onRapidAdd}>
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
