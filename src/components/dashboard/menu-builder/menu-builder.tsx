"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, ChevronRight, LayoutGrid, Layers, Copy, Loader2, Pencil, Check, X } from "lucide-react";
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
  reorderMenuCategories,
  reorderMenuDishes,
} from "@/lib/menu-db";
import { flatRecordsToMenuTree, countSectionContents } from "@/lib/menu-builder-tree";
import {
  renameCategoryInTree,
  addSectionToTree,
  removeSectionFromTree,
  addCategoryToSection,
  removeCategoryFromSection,
  addDishToCategory,
  updateDishInCategory,
  removeDishFromCategory,
  reorderCategoriesInSection,
  reorderDishesInCategory,
  duplicateCategoryInSection,
  patchCategoryInTree,
  recordsToCategory,
  recordsToSection,
} from "@/lib/menu-builder-mutations";
import type { MenuBuilderCategory, MenuBuilderDish, MenuBuilderSection } from "@/lib/menu-builder-types";
import { MAX_CATEGORIES_PER_RESTAURANT, MAX_CATEGORY_NAME_LENGTH } from "@/lib/menu-limits";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { MenuBuilderSkeleton } from "@/components/ui/skeleton";
import { parsePriceInput } from "@/lib/price-input";
import { cn } from "@/lib/utils";
import { DishDetailSheet, type DishDetailDraft } from "./dish-detail-sheet";
import { CapsuleNav } from "@/components/dashboard/capsule-nav";
import { ReorderButtons, moveByIndex } from "./reorder-buttons";

interface EditableCategoryNameProps {
  name: string;
  disabled?: boolean;
  titleClassName?: string;
  onRename: (nextName: string) => Promise<boolean>;
}

function EditableCategoryName({
  name,
  disabled = false,
  titleClassName,
  onRename,
}: EditableCategoryNameProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(name);
  }, [name, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function cancelEdit() {
    setDraft(name);
    setEditing(false);
  }

  async function saveEdit() {
    if (saving) return;
    setSaving(true);
    try {
      const saved = await onRename(draft);
      if (saved) setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <input
          ref={inputRef}
          value={draft}
          maxLength={MAX_CATEGORY_NAME_LENGTH}
          disabled={disabled || saving}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void saveEdit();
            }
            if (e.key === "Escape") cancelEdit();
          }}
          className="air-input min-w-0 flex-1 py-1.5 text-sm"
        />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="shrink-0 text-emerald-600 hover:text-emerald-700"
          onClick={() => void saveEdit()}
          disabled={disabled || saving}
          aria-label="Save name"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="shrink-0 text-slate-500 hover:text-slate-700"
          onClick={cancelEdit}
          disabled={saving}
          aria-label="Cancel rename"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className={cn("truncate", titleClassName)}>{name}</span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        disabled={disabled}
        aria-label={`Rename ${name}`}
        className="rounded-lg p-1 text-[#C7C7CC] transition-colors hover:bg-[#F5F5F7] hover:text-slate-600 disabled:opacity-40"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function MenuBuilder() {
  const { currentRestaurant } = useRestaurant();
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
  const [duplicatingCategoryId, setDuplicatingCategoryId] = useState<string | null>(null);

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

  const loadMenu = useCallback(async (options?: { silent?: boolean }) => {
    if (!currentRestaurant?.id) return;
    if (!options?.silent) setLoading(true);
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
      if (!options?.silent) setLoading(false);
    }
  }, [currentRestaurant?.id]);

  useEffect(() => {
    void loadMenu();
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
      setTree((prev) => addSectionToTree(prev, recordsToSection(created)));
      setActiveSectionId(created.id);
      setNewSectionName("");
      setAddingSection(false);
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

    const previousTree = tree;
    setTree((prev) => removeSectionFromTree(prev, section.id));
    setBusy(true);
    try {
      await deleteMenuCategory(section.id);
    } catch (err) {
      setTree(previousTree);
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
      const created = await createMenuCategory(
        newCategoryName.trim().slice(0, MAX_CATEGORY_NAME_LENGTH),
        currentRestaurant.id,
        { layout_type: "stacked", parent_id: sectionId }
      );
      setTree((prev) =>
        addCategoryToSection(prev, sectionId, recordsToCategory({ ...created, parent_id: sectionId }))
      );
      setNewCategoryName("");
      setAddingCategoryForSection(null);
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteCategory(sectionId: string, category: MenuBuilderCategory) {
    const message = `Delete category "${category.name}" and its ${category.dishes.length} dishes?`;
    if (!confirm(message)) return;

    const previousTree = tree;
    setTree((prev) => removeCategoryFromSection(prev, sectionId, category.id));
    setBusy(true);
    try {
      await deleteMenuCategory(category.id);
    } catch (err) {
      setTree(previousTree);
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
      const created = await createMenuDish(
        categoryId,
        draft.name.trim(),
        "",
        parsePriceInput(draft.price),
        null,
        []
      );
      setTree((prev) => addDishToCategory(prev, categoryId, created));
      setRapidDrafts((prev) => ({ ...prev, [categoryId]: { name: "", price: "" } }));
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
    const { dish, categoryId } = selectedDish;
    const previousTree = tree;

    const optimisticDish: MenuBuilderDish = {
      ...dish,
      name: draft.name.trim(),
      description: draft.description.trim(),
      price: parsePriceInput(draft.price),
      image_url: draft.image_url,
      tags: draft.filterableTags,
      allergens: draft.allergens,
      is_available: draft.is_available,
    };

    setTree((prev) => updateDishInCategory(prev, categoryId, dish.id, optimisticDish));
    setSelectedDish(null);
    setBusy(true);
    try {
      await updateMenuDish(
        dish.id,
        draft.name,
        draft.description,
        parsePriceInput(draft.price),
        draft.image_url,
        draft.filterableTags,
        draft.allergens,
        draft.is_available
      );
      toast.success("✨ Dish updated successfully");
    } catch (err) {
      setTree(previousTree);
      const message = formatSupabaseError(err);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAvailabilityChange(isAvailable: boolean) {
    if (!selectedDish) return;
    const { dish, categoryId } = selectedDish;
    const previousTree = tree;

    setSelectedDish((prev) =>
      prev ? { ...prev, dish: { ...prev.dish, is_available: isAvailable } } : null
    );
    setTree((prev) =>
      updateDishInCategory(prev, categoryId, dish.id, { is_available: isAvailable })
    );

    try {
      await updateMenuDishAvailability(dish.id, isAvailable);
      toast.success(isAvailable ? "Dish is now visible on your menu" : "Dish hidden from public menu");
    } catch (err) {
      setTree(previousTree);
      setSelectedDish((prev) =>
        prev ? { ...prev, dish: { ...prev.dish, is_available: !isAvailable } } : null
      );
      const message = formatSupabaseError(err);
      setError(message);
      toast.error(message);
      throw err;
    }
  }

  async function handleDeleteDish(dish: MenuBuilderDish, categoryId: string) {
    if (!confirm(`Delete "${dish.name}"?`)) return;

    const previousTree = tree;
    setTree((prev) => removeDishFromCategory(prev, categoryId, dish.id));
    if (selectedDish?.dish.id === dish.id) setSelectedDish(null);

    setBusy(true);
    try {
      await deleteMenuDish(dish.id);
      toast.success("Dish deleted");
    } catch (err) {
      setTree(previousTree);
      const message = formatSupabaseError(err);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLayoutChange(category: MenuBuilderCategory, layout: "stacked" | "carousel") {
    const previousTree = tree;
    setTree((prev) => patchCategoryInTree(prev, category.id, { layout_type: layout }));
    try {
      await updateMenuCategory(category.id, { layout_type: layout });
    } catch (err) {
      setTree(previousTree);
      setError(formatSupabaseError(err));
    }
  }

  async function handleDuplicateCategory(sectionId: string, category: MenuBuilderCategory) {
    if (!currentRestaurant?.id) return;
    if (totalCategories >= MAX_CATEGORIES_PER_RESTAURANT) {
      const message = `Maximum ${MAX_CATEGORIES_PER_RESTAURANT} sections + categories reached.`;
      setError(message);
      toast.error(message);
      return;
    }

    setDuplicatingCategoryId(category.id);
    setBusy(true);
    try {
      const created = await duplicateMenuCategory(category.id, currentRestaurant.id);
      setTree((prev) =>
        duplicateCategoryInSection(
          prev,
          sectionId,
          recordsToCategory({ ...created, parent_id: sectionId })
        )
      );
      toast.success("✨ Category and all items duplicated successfully!");
    } catch (err) {
      const message = formatSupabaseError(err);
      setError(message);
      toast.error(message);
    } finally {
      setDuplicatingCategoryId(null);
      setBusy(false);
    }
  }

  async function handleDuplicateDish(dish: MenuBuilderDish, categoryId: string) {
    setBusy(true);
    try {
      const created = await duplicateMenuDish(dish.id);
      setTree((prev) => addDishToCategory(prev, categoryId, created));
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
    const previousTree = tree;
    setTree((prev) => patchCategoryInTree(prev, categoryId, { description: trimmed || null }));
    try {
      await updateMenuCategory(categoryId, { description: trimmed || null });
    } catch (err) {
      setTree(previousTree);
      const message = formatSupabaseError(err);
      setError(message);
      toast.error(message);
    }
  }

  async function handleRenameCategory(id: string, currentName: string, nextName: string): Promise<boolean> {
    const trimmed = nextName.trim().slice(0, MAX_CATEGORY_NAME_LENGTH);
    if (!trimmed) {
      toast.error("Category name cannot be empty");
      return false;
    }
    if (trimmed === currentName.trim()) {
      return true;
    }

    const previousTree = tree;
    setTree((prev) => renameCategoryInTree(prev, id, trimmed));

    try {
      await updateMenuCategory(id, { name: trimmed });
      toast.success("✨ Section renamed successfully!");
      return true;
    } catch (err) {
      setTree(previousTree);
      const message = formatSupabaseError(err);
      setError(message);
      toast.error(message);
      return false;
    }
  }

  async function handleReorderCategory(
    sectionId: string,
    categoryId: string,
    direction: -1 | 1
  ) {
    const section = tree.sections.find((entry) => entry.id === sectionId);
    if (!section) return;

    const currentIndex = section.categories.findIndex((category) => category.id === categoryId);
    if (currentIndex < 0) return;

    const reordered = moveByIndex(section.categories, currentIndex, direction);
    if (!reordered) return;

    const orderedIds = reordered.map((category) => category.id);
    const previousTree = tree;
    setTree((prev) => reorderCategoriesInSection(prev, sectionId, orderedIds));

    try {
      await reorderMenuCategories(
        orderedIds.map((id, order_index) => ({ id, order_index }))
      );
    } catch (err) {
      setTree(previousTree);
      toast.error(formatSupabaseError(err));
    }
  }

  async function handleReorderDish(categoryId: string, dishId: string, direction: -1 | 1) {
    const category = tree.sections
      .flatMap((section) => section.categories)
      .find((entry) => entry.id === categoryId);
    if (!category) return;

    const currentIndex = category.dishes.findIndex((dish) => dish.id === dishId);
    if (currentIndex < 0) return;

    const reordered = moveByIndex(category.dishes, currentIndex, direction);
    if (!reordered) return;

    const orderedIds = reordered.map((dish) => dish.id);
    const previousTree = tree;
    setTree((prev) => reorderDishesInCategory(prev, categoryId, orderedIds));

    try {
      await reorderMenuDishes(
        orderedIds.map((id, display_order) => ({ id, display_order }))
      );
    } catch (err) {
      setTree(previousTree);
      toast.error(formatSupabaseError(err));
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
              <div className="flex items-center justify-between gap-3">
                <EditableCategoryName
                  name={activeSection.name}
                  titleClassName="air-section-title"
                  disabled={busy}
                  onRename={(nextName) =>
                    handleRenameCategory(activeSection.id, activeSection.name, nextName)
                  }
                />
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

              <div className="sticky top-0 z-10 -mx-1 rounded-2xl border border-[#F5F5F7]/90 bg-[#FAFAFA]/95 px-4 py-3 shadow-sm backdrop-blur-sm">
                {addingCategoryForSection === activeSection.id ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      autoFocus
                      placeholder="Category name (e.g. Starters)"
                      value={newCategoryName}
                      maxLength={MAX_CATEGORY_NAME_LENGTH}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddCategory(activeSection.id)}
                      className="air-input flex-1"
                    />
                    <div className="flex gap-2">
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
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingCategoryForSection(activeSection.id)}
                    disabled={busy || totalCategories >= MAX_CATEGORIES_PER_RESTAURANT}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#E5E5EA] bg-white py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-white disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add Category
                  </button>
                )}
              </div>

              {activeSection.categories.length === 0 ? (
                <div className="air-card air-card-pad py-10 text-center text-sm text-[#86868B]">
                  No categories yet. Use the button above to add Starters, Mains, Desserts…
                </div>
              ) : (
                activeSection.categories.map((category, categoryIndex) => (
                  <CategoryBlock
                    key={category.id}
                    category={category}
                    categoryIndex={categoryIndex}
                    categoryCount={activeSection.categories.length}
                    busy={busy}
                    duplicating={duplicatingCategoryId === category.id}
                    rapidDraft={rapidDrafts[category.id] ?? { name: "", price: "" }}
                    onRapidDraftChange={(draft) =>
                      setRapidDrafts((prev) => ({ ...prev, [category.id]: draft }))
                    }
                    onRapidAdd={() => handleRapidAddDish(category.id)}
                    onDeleteCategory={() => handleDeleteCategory(activeSection.id, category)}
                    onDuplicateCategory={() => handleDuplicateCategory(activeSection.id, category)}
                    onDeleteDish={(dish) => handleDeleteDish(dish, category.id)}
                    onDuplicateDish={(dish) => handleDuplicateDish(dish, category.id)}
                    onOpenDish={(dish) => setSelectedDish({ dish, categoryId: category.id })}
                    onLayoutChange={(layout) => handleLayoutChange(category, layout)}
                    onNoteChange={(note) => handleCategoryNoteChange(category.id, note)}
                    onRename={(nextName) => handleRenameCategory(category.id, category.name, nextName)}
                    onMoveCategory={(direction) =>
                      handleReorderCategory(activeSection.id, category.id, direction)
                    }
                    onMoveDish={(dishId, direction) =>
                      handleReorderDish(category.id, dishId, direction)
                    }
                  />
                ))
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
  categoryIndex,
  categoryCount,
  busy,
  duplicating,
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
  onRename,
  onMoveCategory,
  onMoveDish,
}: {
  category: MenuBuilderCategory;
  categoryIndex: number;
  categoryCount: number;
  busy: boolean;
  duplicating: boolean;
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
  onRename: (nextName: string) => Promise<boolean>;
  onMoveCategory: (direction: -1 | 1) => void;
  onMoveDish: (dishId: string, direction: -1 | 1) => void;
}) {
  const nameRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const [noteDraft, setNoteDraft] = useState(category.description ?? "");

  useEffect(() => {
    setNoteDraft(category.description ?? "");
  }, [category.id]);

  async function handleQuickAdd() {
    await onRapidAdd();
    nameRef.current?.focus();
  }

  return (
    <div className="air-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F5F5F7]/80 px-6 py-5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <ReorderButtons
            onMoveUp={() => onMoveCategory(-1)}
            onMoveDown={() => onMoveCategory(1)}
            canMoveUp={categoryIndex > 0}
            canMoveDown={categoryIndex < categoryCount - 1}
            disabled={busy || duplicating}
          />
          <LayoutGrid className="h-4 w-4 shrink-0 text-slate-500" />
          <EditableCategoryName
            name={category.name}
            titleClassName="font-semibold text-slate-900"
            disabled={busy || duplicating}
            onRename={onRename}
          />
          <span className="shrink-0 text-xs text-[#86868B]">{category.dishes.length} dishes</span>
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
            disabled={busy || duplicating}
            aria-label={`Duplicate ${category.name}`}
          >
            {duplicating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
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
        {category.dishes.map((dish, dishIndex) => (
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
            <ReorderButtons
              onMoveUp={() => onMoveDish(dish.id, -1)}
              onMoveDown={() => onMoveDish(dish.id, 1)}
              canMoveUp={dishIndex > 0}
              canMoveDown={dishIndex < category.dishes.length - 1}
              disabled={busy}
              className="opacity-0 transition-opacity group-hover:opacity-100"
            />
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
