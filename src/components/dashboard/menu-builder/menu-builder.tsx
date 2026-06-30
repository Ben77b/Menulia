"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, ChevronRight, LayoutGrid, Layers, Copy } from "lucide-react";
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
  updateMenuDishAvailability,
  deleteMenuDish,
  duplicateMenuDish,
  duplicateMenuCategory,
} from "@/lib/menu-db";
import { flatRecordsToMenuTree, countSectionContents } from "@/lib/menu-builder-tree";
import type { MenuBuilderCategory, MenuBuilderDish, MenuBuilderSection } from "@/lib/menu-builder-types";
import { MAX_CATEGORIES_PER_RESTAURANT, MAX_CATEGORY_NAME_LENGTH } from "@/lib/menu-limits";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { MenuBuilderSkeleton } from "@/components/ui/skeleton";
import { parsePriceInput } from "@/lib/price-input";
import { cn } from "@/lib/utils";
import { DishDetailSheet, type DishDetailDraft } from "./dish-detail-sheet";
import { CapsuleNav } from "@/components/dashboard/capsule-nav";

export function MenuBuilder() {
  const { currentRestaurant, refreshRestaurants } = useRestaurant();
  const toast = useToast();
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
        parsePriceInput(draft.price),
        null,
        []
      );
      setRapidDrafts((prev) => ({ ...prev, [categoryId]: { name: "", price: "" } }));
      await loadMenu();
      await refreshRestaurants();
      toast.success("✨ Dish added");
    } catch (err) {
      const message = formatSupabaseError(err);
      setError(message);
      toast.error(message);
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
        parsePriceInput(draft.price),
        draft.image_url,
        draft.filterableTags,
        draft.allergens,
        draft.is_available
      );
      setSelectedDish(null);
      await loadMenu();
      await refreshRestaurants();
      toast.success("✨ Dish updated successfully");
    } catch (err) {
      const message = formatSupabaseError(err);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAvailabilityChange(isAvailable: boolean) {
    if (!selectedDish) return;
    try {
      await updateMenuDishAvailability(selectedDish.dish.id, isAvailable);
      setSelectedDish((prev) =>
        prev ? { ...prev, dish: { ...prev.dish, is_available: isAvailable } } : null
      );
      await loadMenu();
      await refreshRestaurants();
      toast.success(isAvailable ? "Dish is now visible on your menu" : "Dish hidden from public menu");
    } catch (err) {
      const message = formatSupabaseError(err);
      setError(message);
      toast.error(message);
      throw err;
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
      toast.success("Dish deleted");
    } catch (err) {
      const message = formatSupabaseError(err);
      setError(message);
      toast.error(message);
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

  async function handleDuplicateCategory(category: MenuBuilderCategory) {
    if (!currentRestaurant?.id) return;
    if (totalCategories >= MAX_CATEGORIES_PER_RESTAURANT) {
      const message = `Maximum ${MAX_CATEGORIES_PER_RESTAURANT} sections + categories reached.`;
      setError(message);
      toast.error(message);
      return;
    }

    setBusy(true);
    try {
      await duplicateMenuCategory(category.id, currentRestaurant.id);
      await loadMenu();
      await refreshRestaurants();
      toast.success(`"${category.name}" duplicated`);
    } catch (err) {
      const message = formatSupabaseError(err);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDuplicateDish(dish: MenuBuilderDish) {
    setBusy(true);
    try {
      await duplicateMenuDish(dish.id);
      await loadMenu();
      await refreshRestaurants();
      toast.success(`"${dish.name}" duplicated`);
    } catch (err) {
      const message = formatSupabaseError(err);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCategoryNoteChange(categoryId: string, description: string) {
    const trimmed = description.trim();
    try {
      await updateMenuCategory(categoryId, { description: trimmed || null });
      await loadMenu();
    } catch (err) {
      const message = formatSupabaseError(err);
      setError(message);
      toast.error(message);
    }
  }

  if (loading) {
    return <MenuBuilderSkeleton />;
  }

  return (
    <div className="air-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="air-page-title">Menu Builder</h1>
          <p className="air-page-subtitle">
            Sections → Categories → Dishes. Tab to price, Enter to save.
          </p>
        </div>
        <Button
          variant="dark"
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
        <div className="rounded-2xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {addingSection && (
        <div className="air-card air-card-pad flex gap-2">
          <input
            autoFocus
            placeholder="Section name (e.g. Food, Drinks)"
            value={newSectionName}
            maxLength={MAX_CATEGORY_NAME_LENGTH}
            onChange={(e) => setNewSectionName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddSection()}
            className="air-input flex-1"
          />
          <Button variant="dark" onClick={handleAddSection} disabled={!newSectionName.trim() || busy}>
            Save
          </Button>
          <Button variant="outline" onClick={() => setAddingSection(false)}>
            Cancel
          </Button>
        </div>
      )}

      {tree.sections.length === 0 ? (
        <div className="air-card air-card-pad py-16 text-center">
          <Layers className="mx-auto mb-3 h-10 w-10 text-[#C7C7CC]" />
          <p className="text-[#86868B]">Create your first section to start building the menu tree.</p>
        </div>
      ) : (
        <>
          <CapsuleNav
            items={tree.sections.map((section) => ({
              id: section.id,
              label: `${section.name} (${section.categories.length})`,
            }))}
            active={activeSection?.id ?? tree.sections[0].id}
            onChange={setActiveSectionId}
            ariaLabel="Menu sections"
          />

          {activeSection && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="air-section-title">{activeSection.name}</h2>
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
                <div className="air-card air-card-pad py-10 text-center text-sm text-[#86868B]">
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
                    onDuplicateCategory={() => handleDuplicateCategory(category)}
                    onDeleteDish={(dish) => handleDeleteDish(dish, category.id)}
                    onDuplicateDish={handleDuplicateDish}
                    onOpenDish={(dish) => setSelectedDish({ dish, categoryId: category.id })}
                    onLayoutChange={(layout) => handleLayoutChange(category, layout)}
                    onNoteChange={(note) => handleCategoryNoteChange(category.id, note)}
                  />
                ))
              )}

              {addingCategoryForSection === activeSection.id ? (
                <div className="air-card air-card-pad flex gap-2">
                  <input
                    autoFocus
                    placeholder="Category name (e.g. Starters)"
                    value={newCategoryName}
                    maxLength={MAX_CATEGORY_NAME_LENGTH}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCategory(activeSection.id)}
                    className="air-input flex-1"
                  />
                  <Button
                    variant="dark"
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
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#E5E5EA] py-3.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-white"
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
        onAvailabilityChange={handleAvailabilityChange}
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
  onDuplicateCategory,
  onDeleteDish,
  onDuplicateDish,
  onOpenDish,
  onLayoutChange,
  onNoteChange,
}: {
  category: MenuBuilderCategory;
  busy: boolean;
  rapidDraft: { name: string; price: string };
  onRapidDraftChange: (draft: { name: string; price: string }) => void;
  onRapidAdd: () => Promise<void>;
  onDeleteCategory: () => void;
  onDuplicateCategory: () => void;
  onDeleteDish: (dish: MenuBuilderDish) => void;
  onDuplicateDish: (dish: MenuBuilderDish) => void;
  onOpenDish: (dish: MenuBuilderDish) => void;
  onLayoutChange: (layout: "stacked" | "carousel") => void;
  onNoteChange: (note: string) => void;
}) {
  const nameRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const [noteDraft, setNoteDraft] = useState(category.description ?? "");

  useEffect(() => {
    setNoteDraft(category.description ?? "");
  }, [category.description]);

  async function handleQuickAdd() {
    await onRapidAdd();
    nameRef.current?.focus();
  }

  return (
    <div className="air-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F5F5F7]/80 px-6 py-5">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-slate-500" />
          <h3 className="font-semibold text-slate-900">{category.name}</h3>
          <span className="text-xs text-[#86868B]">{category.dishes.length} dishes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="air-capsule-nav !w-auto p-0.5">
            {(["stacked", "carousel"] as const).map((layout) => (
              <button
                key={layout}
                type="button"
                onClick={() => onLayoutChange(layout)}
                className={cn(
                  "air-capsule-nav-item !px-3 !py-1.5 text-xs capitalize",
                  category.layout_type === layout && "air-capsule-nav-item-active"
                )}
              >
                {layout}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-slate-500 hover:text-slate-700"
            onClick={onDuplicateCategory}
            disabled={busy}
            aria-label={`Duplicate ${category.name}`}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="text-red-500" onClick={onDeleteCategory}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border-b border-[#F5F5F7]/80 px-6 py-4">
        <label className="mb-1.5 block text-xs font-medium text-slate-700">
          Section Note / Subtitle
        </label>
        <input
          type="text"
          value={noteDraft}
          disabled={busy}
          placeholder='e.g. "Optional flamed" or "Served with miso soup"'
          onChange={(e) => setNoteDraft(e.target.value)}
          onBlur={() => {
            const trimmed = noteDraft.trim();
            const saved = (category.description ?? "").trim();
            if (trimmed !== saved) {
              void onNoteChange(trimmed);
            }
          }}
          className="air-input"
        />
      </div>

      <div className="divide-y divide-[#F5F5F7]">
        {category.dishes.map((dish) => (
          <div
            key={dish.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpenDish(dish)}
            onKeyDown={(e) => (e.key === "Enter" ? onOpenDish(dish) : undefined)}
            className={cn(
              "air-list-row group flex cursor-pointer items-center gap-3 px-5 py-4",
              !dish.is_available && "opacity-60"
            )}
          >
            {dish.image_url ? (
              <img
                src={dish.image_url}
                alt=""
                className="h-10 w-10 rounded-[10px] object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-[10px] bg-[#F5F5F7]" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium text-slate-900">{dish.name}</p>
                {!dish.is_available && (
                  <span className="air-badge shrink-0">Hidden</span>
                )}
              </div>
              {dish.description ? (
                <p className="truncate text-xs text-[#86868B]">{dish.description}</p>
              ) : (
                <p className="text-xs text-[#86868B]">Tap to add photo, description, and tags</p>
              )}
            </div>
            <p className="font-semibold text-slate-900">€{dish.price.toFixed(2)}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateDish(dish);
              }}
              disabled={busy}
              aria-label={`Duplicate ${dish.name}`}
              className="rounded-lg p-1 text-[#C7C7CC] opacity-0 hover:text-slate-600 group-hover:opacity-100 disabled:opacity-40"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteDish(dish);
              }}
              className="rounded-lg p-1 text-[#C7C7CC] opacity-0 hover:text-red-500 group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <ChevronRight className="h-4 w-4 text-[#C7C7CC] group-hover:text-slate-500" />
          </div>
        ))}

        <div className="space-y-3 px-5 py-4">
          <p className="text-xs leading-relaxed text-[#86868B]">
            Quick add with name and price. Tap any dish above to edit full details.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-700">Name</label>
              <input
                ref={nameRef}
                placeholder="e.g. Margherita"
                value={rapidDraft.name}
                disabled={busy}
                onChange={(e) => onRapidDraftChange({ ...rapidDraft, name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    priceRef.current?.focus();
                  }
                }}
                className="air-input"
              />
            </div>
            <div className="w-full sm:w-28">
              <label className="mb-1 block text-xs font-medium text-slate-700">Price (€)</label>
              <input
                ref={priceRef}
                type="text"
                inputMode="decimal"
                placeholder="12,50"
                value={rapidDraft.price}
                disabled={busy}
                onChange={(e) => onRapidDraftChange({ ...rapidDraft, price: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleQuickAdd();
                  }
                }}
                className="air-input"
              />
            </div>
            <Button
              size="sm"
              variant="dark"
              className="w-full sm:w-auto"
              disabled={busy || !rapidDraft.name.trim()}
              onClick={() => void handleQuickAdd()}
            >
              Add dish
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
