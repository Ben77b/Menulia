"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, ChevronRight, LayoutGrid, Layers, Copy, Loader2, Pencil, Check, X, Sparkles } from "lucide-react";
import { useRestaurant } from "@/contexts/restaurant-context";
import { useDashboardSearchParam } from "@/hooks/use-dashboard-search-param";
import { useSessionPersistedState } from "@/hooks/use-session-persisted-state";
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
  reorderSectionsInTree,
  reorderDishesInCategory,
  duplicateCategoryInSection,
  patchCategoryInTree,
  recordsToCategory,
  recordsToSection,
  findCategory,
} from "@/lib/menu-builder-mutations";
import type { MenuBuilderCategory, MenuBuilderDish, MenuBuilderSection } from "@/lib/menu-builder-types";
import { MAX_CATEGORIES_PER_SECTION, MAX_SECTIONS, MAX_CATEGORY_NAME_LENGTH } from "@/lib/menu-limits";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { MenuBuilderSkeleton } from "@/components/ui/skeleton";
import { parsePriceInput } from "@/lib/price-input";
import { cn } from "@/lib/utils";
import { DishDetailSheet, type DishDetailDraft } from "./dish-detail-sheet";
import { CapsuleNav } from "@/components/dashboard/capsule-nav";
import { ReorderButtons, moveByIndex } from "./reorder-buttons";
import { computeNextDishDisplayOrder } from "@/lib/menu-dish-order";
import { mergeLocalizedText, resolveLocalizedText, type LocalizedTextValue } from "@/lib/localized-text";
import { translateMenuTreeToLanguage } from "@/lib/menu-translation";

function isBenignMenuBuilderError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : formatSupabaseError(error);
  return (
    /^TypeError\b/i.test(message) ||
    /cannot read propert/i.test(message) ||
    /undefined is not an object/i.test(message)
  );
}

function toMenuBuilderErrorMessage(error: unknown): string | null {
  if (isBenignMenuBuilderError(error)) {
    console.warn("[menu-builder]", error);
    return null;
  }
  return formatSupabaseError(error);
}

function reportMenuBuilderError(
  error: unknown,
  setError: (message: string | null) => void
): string | null {
  const message = toMenuBuilderErrorMessage(error);
  if (message) setError(message);
  return message;
}

interface MenuBuilderFormDrafts {
  rapidDrafts: Record<string, { name: string; price: string }>;
  newSectionName: string;
  newCategoryName: string;
  addingSection: boolean;
  addingCategoryForSection: string | null;
}

const EMPTY_FORM_DRAFTS: MenuBuilderFormDrafts = {
  rapidDrafts: {},
  newSectionName: "",
  newCategoryName: "",
  addingSection: false,
  addingCategoryForSection: null,
};

function normalizeMenuBuilderFormDrafts(value: unknown): MenuBuilderFormDrafts {
  if (!value || typeof value !== "object") {
    return EMPTY_FORM_DRAFTS;
  }

  const draft = value as Partial<MenuBuilderFormDrafts>;
  const rapidDrafts =
    draft.rapidDrafts && typeof draft.rapidDrafts === "object" ? draft.rapidDrafts : {};

  return {
    rapidDrafts,
    newSectionName: typeof draft.newSectionName === "string" ? draft.newSectionName : "",
    newCategoryName: typeof draft.newCategoryName === "string" ? draft.newCategoryName : "",
    addingSection: Boolean(draft.addingSection),
    addingCategoryForSection:
      typeof draft.addingCategoryForSection === "string" ? draft.addingCategoryForSection : null,
  };
}

function categoryCardId(categoryId: string): string {
  return `category-card-${categoryId}`;
}

interface EditableCategoryNameProps {
  name: LocalizedTextValue;
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
  const displayName = resolveLocalizedText(name, "en");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(displayName);
  }, [displayName, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function cancelEdit() {
    setDraft(displayName);
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
      <span className={cn("truncate", titleClassName)}>{displayName}</span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        disabled={disabled}
        aria-label={`Rename ${displayName}`}
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
  const [sectionParam, setSectionParam] = useDashboardSearchParam("section", null, "");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRestaurantRef = useRef<string | null>(null);

  const draftStorageKey = currentRestaurant?.id
    ? `menulia:menu-builder-drafts:${currentRestaurant.id}`
    : null;
  const [formDrafts, setFormDrafts] = useSessionPersistedState<MenuBuilderFormDrafts>(
    draftStorageKey,
    EMPTY_FORM_DRAFTS,
    normalizeMenuBuilderFormDrafts
  );
  const [scrollToCategoryId, setScrollToCategoryId] = useState<string | null>(null);

  const {
    rapidDrafts,
    newSectionName,
    newCategoryName,
    addingSection,
    addingCategoryForSection,
  } = formDrafts;

  const setRapidDrafts = (
    updater:
      | Record<string, { name: string; price: string }>
      | ((
          prev: Record<string, { name: string; price: string }>
        ) => Record<string, { name: string; price: string }>)
  ) => {
    setFormDrafts((prev) => ({
      ...prev,
      rapidDrafts:
        typeof updater === "function" ? updater(prev?.rapidDrafts ?? {}) : updater,
    }));
  };

  const setNewSectionName = (value: string) =>
    setFormDrafts((prev) => ({ ...prev, newSectionName: value }));
  const setNewCategoryName = (value: string) =>
    setFormDrafts((prev) => ({ ...prev, newCategoryName: value }));
  const setAddingSection = (value: boolean) =>
    setFormDrafts((prev) => ({ ...prev, addingSection: value }));
  const setAddingCategoryForSection = (value: string | null) =>
    setFormDrafts((prev) => ({ ...prev, addingCategoryForSection: value }));

  const [selectedDish, setSelectedDish] = useState<{
    dish: MenuBuilderDish;
    categoryId: string;
  } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [duplicatingCategoryId, setDuplicatingCategoryId] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  const selectedCategory = useMemo(
    () => (selectedDish ? findCategory(tree, selectedDish.categoryId) : null),
    [selectedDish, tree]
  );

  const activeSection = useMemo(() => {
    const sections = tree.sections ?? [];
    if (!sections.length) return null;
    if (sectionParam && sections.some((section) => section?.id === sectionParam)) {
      return sections.find((section) => section?.id === sectionParam) ?? sections[0] ?? null;
    }
    return sections[0] ?? null;
  }, [tree.sections, sectionParam]);

  const activeSectionIndex = useMemo(
    () =>
      activeSection?.id
        ? (tree.sections ?? []).findIndex((section) => section?.id === activeSection.id)
        : -1,
    [activeSection, tree.sections]
  );

  const setActiveSectionId = useCallback(
    (sectionId: string) => {
      setSectionParam(sectionId);
    },
    [setSectionParam]
  );

  useEffect(() => {
    if (!scrollToCategoryId) return;
    const element = document.getElementById(categoryCardId(scrollToCategoryId));
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    setScrollToCategoryId(null);
  }, [scrollToCategoryId, tree]);

  useEffect(() => {
    if (loading || !activeSection?.id) return;
    if (sectionParam !== activeSection.id) {
      setSectionParam(activeSection.id);
    }
  }, [loading, activeSection, sectionParam, setSectionParam]);

  useEffect(() => {
    if (!addingCategoryForSection) return;
    const sectionExists = (tree.sections ?? []).some(
      (section) => section?.id === addingCategoryForSection
    );
    if (!sectionExists) {
      setAddingCategoryForSection(null);
    }
  }, [addingCategoryForSection, tree.sections]);

  const loadMenu = useCallback(async (options?: { silent?: boolean }) => {
    if (!currentRestaurant?.id) return;
    if (!options?.silent) setLoading(true);
    setError(null);
    try {
      const records = await fetchMenuCategories(currentRestaurant.id);
      setTree(flatRecordsToMenuTree(records ?? []));
    } catch (err) {
      console.error(err);
      reportMenuBuilderError(err, setError);
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, [currentRestaurant?.id]);

  useEffect(() => {
    if (!currentRestaurant?.id) return;
    const isRepeatVisit = loadedRestaurantRef.current === currentRestaurant.id;
    loadedRestaurantRef.current = currentRestaurant.id;
    void loadMenu({ silent: isRepeatVisit });
  }, [currentRestaurant?.id, loadMenu]);

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
    if (tree.sections.length >= MAX_SECTIONS) {
      setError(`Maximum ${MAX_SECTIONS} sections reached.`);
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
      reportMenuBuilderError(err, setError);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteSection(section: MenuBuilderSection) {
    const { categories, dishes } = countSectionContents(section);
    const message = `Delete section "${resolveLocalizedText(section.name, "en")}" and all ${categories} categories with ${dishes} dishes? This cannot be undone.`;
    if (!confirm(message)) return;

    const previousTree = tree;
    setTree((prev) => removeSectionFromTree(prev, section.id));
    setBusy(true);
    try {
      await deleteMenuCategory(section.id);
    } catch (err) {
      setTree(previousTree);
      reportMenuBuilderError(err, setError);
    } finally {
      setBusy(false);
    }
  }

  async function handleAddCategory(sectionId: string) {
    if (!currentRestaurant?.id || !sectionId || !newCategoryName.trim()) return;
    const section = tree.sections?.find((entry) => entry?.id === sectionId);
    if ((section?.categories?.length ?? 0) >= MAX_CATEGORIES_PER_SECTION) {
      setError(`Maximum ${MAX_CATEGORIES_PER_SECTION} categories per section reached.`);
      return;
    }
    setBusy(true);
    try {
      const created = await createMenuCategory(
        newCategoryName.trim().slice(0, MAX_CATEGORY_NAME_LENGTH),
        currentRestaurant.id,
        { layout_type: "stacked", parent_id: sectionId }
      );
      if (!created?.id) {
        throw new Error("Category was created but no id was returned.");
      }
      setTree((prev) =>
        addCategoryToSection(prev, sectionId, recordsToCategory({ ...created, parent_id: sectionId }))
      );
      setNewCategoryName("");
      setAddingCategoryForSection(null);
      setScrollToCategoryId(created.id);
    } catch (err) {
      reportMenuBuilderError(err, setError);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteCategory(sectionId: string, category: MenuBuilderCategory) {
    const message = `Delete category "${resolveLocalizedText(category.name, "en")}" and its ${category.dishes.length} dishes?`;
    if (!confirm(message)) return;

    const previousTree = tree;
    setTree((prev) => removeCategoryFromSection(prev, sectionId, category.id));
    setBusy(true);
    try {
      await deleteMenuCategory(category.id);
    } catch (err) {
      setTree(previousTree);
      reportMenuBuilderError(err, setError);
    } finally {
      setBusy(false);
    }
  }

  async function handleRapidAddDish(categoryId: string) {
    const draft = rapidDrafts[categoryId];
    if (!draft?.name.trim()) return;

    const existingDishes = findCategory(tree, categoryId)?.dishes ?? [];
    const displayOrder = computeNextDishDisplayOrder(existingDishes);

    setBusy(true);
    try {
      const created = await createMenuDish(
        categoryId,
        draft.name.trim(),
        "",
        parsePriceInput(draft.price),
        null,
        [],
        [],
        false,
        { displayOrder }
      );
      setTree((prev) =>
        addDishToCategory(prev, categoryId, { ...created, display_order: displayOrder })
      );
      setRapidDrafts((prev) => ({ ...prev, [categoryId]: { name: "", price: "" } }));
      toast.success("✨ Dish added");
    } catch (err) {
      const message = toMenuBuilderErrorMessage(err);
      if (message) {
        setError(message);
        toast.error(message);
      }
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
      name: mergeLocalizedText(dish.name, "en", draft.name.trim()),
      description: mergeLocalizedText(dish.description, "en", draft.description.trim()),
      price: parsePriceInput(draft.price),
      image_url: draft.image_url,
      tags: draft.filterableTags,
      allergens: draft.allergens,
      is_available: draft.is_available,
      hide_price: draft.hide_price,
    };

    setTree((prev) => updateDishInCategory(prev, categoryId, dish.id, optimisticDish));
    setSelectedDish(null);
    setBusy(true);
    try {
      await updateMenuDish(
        dish.id,
        optimisticDish.name,
        optimisticDish.description,
        parsePriceInput(draft.price),
        draft.image_url,
        draft.filterableTags,
        draft.allergens,
        draft.is_available,
        draft.hide_price
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
    if (!confirm(`Delete "${resolveLocalizedText(dish.name, "en")}"?`)) return;

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
      reportMenuBuilderError(err, setError);
    }
  }

  async function handleDuplicateCategory(sectionId: string, category: MenuBuilderCategory) {
    if (!currentRestaurant?.id) return;
    const section = tree.sections.find((entry) => entry.id === sectionId);
    if ((section?.categories.length ?? 0) >= MAX_CATEGORIES_PER_SECTION) {
      const message = `Maximum ${MAX_CATEGORIES_PER_SECTION} categories per section reached.`;
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
      toast.success(`"${resolveLocalizedText(dish.name, "en")}" duplicated`);
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
    const section = tree.sections.find((entry) => entry.id === categoryId);
    const category = section ?? findCategory(tree, categoryId);
    const currentDescription = section?.description ?? category?.description ?? "";
    const mergedDescription = mergeLocalizedText(currentDescription, "en", trimmed);

    setTree((prev) =>
      patchCategoryInTree(prev, categoryId, {
        description: trimmed ? mergedDescription : null,
      })
    );
    try {
      await updateMenuCategory(categoryId, {
        description: trimmed ? mergedDescription : null,
      });
    } catch (err) {
      setTree(previousTree);
      const message = formatSupabaseError(err);
      setError(message);
      toast.error(message);
    }
  }

  async function handleRenameCategory(
    id: string,
    currentName: LocalizedTextValue,
    nextName: string
  ): Promise<boolean> {
    const trimmed = nextName.trim().slice(0, MAX_CATEGORY_NAME_LENGTH);
    if (!trimmed) {
      toast.error("Category name cannot be empty");
      return false;
    }
    if (trimmed === resolveLocalizedText(currentName, "en").trim()) {
      return true;
    }

    const mergedName = mergeLocalizedText(currentName, "en", trimmed);
    const previousTree = tree;
    setTree((prev) => renameCategoryInTree(prev, id, mergedName));

    try {
      await updateMenuCategory(id, { name: mergedName });
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

  async function handleReorderSection(sectionId: string | null | undefined, direction: -1 | 1) {
    if (!sectionId) return;

    const sections = tree.sections ?? [];
    const currentIndex = sections.findIndex((section) => section?.id === sectionId);
    if (currentIndex < 0) return;

    const reordered = moveByIndex(sections, currentIndex, direction);
    if (!reordered) return;

    const orderedIds = reordered
      .map((section) => section?.id)
      .filter((id): id is string => Boolean(id));
    if (orderedIds.length === 0) return;

    const previousTree = tree;
    setTree((prev) => reorderSectionsInTree(prev, orderedIds));

    try {
      await reorderMenuCategories(
        orderedIds.map((id, order_index) => ({ id, order_index }))
      );
    } catch (err) {
      setTree(previousTree);
      toast.error(formatSupabaseError(err));
    }
  }

  async function handleReorderCategory(
    sectionId: string | null | undefined,
    categoryId: string | null | undefined,
    direction: -1 | 1
  ) {
    if (!sectionId || !categoryId) return;

    const section = tree.sections?.find((entry) => entry?.id === sectionId);
    const categories = section?.categories ?? [];
    const currentIndex = categories.findIndex((category) => category?.id === categoryId);
    if (currentIndex < 0) return;

    const reordered = moveByIndex(categories, currentIndex, direction);
    if (!reordered) return;

    const orderedIds = reordered
      .map((category) => category?.id)
      .filter((id): id is string => Boolean(id));
    if (orderedIds.length === 0) return;

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

  async function handleReorderDish(
    categoryId: string | null | undefined,
    dishId: string | null | undefined,
    direction: -1 | 1
  ) {
    if (!categoryId || !dishId) return;

    const category = (tree.sections ?? [])
      .flatMap((section) => section?.categories ?? [])
      .find((entry) => entry?.id === categoryId);
    const dishes = category?.dishes ?? [];
    const currentIndex = dishes.findIndex((dish) => dish?.id === dishId);
    if (currentIndex < 0) return;

    const reordered = moveByIndex(dishes, currentIndex, direction);
    if (!reordered) return;

    const orderedIds = reordered
      .map((dish) => dish?.id)
      .filter((id): id is string => Boolean(id));
    if (orderedIds.length === 0) return;

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

  async function handleTranslateMenu() {
    if (translating || busy) return;

    setTranslating(true);
    setError(null);
    try {
      const updated = await translateMenuTreeToLanguage(tree, "es");
      setTree(updated);
      toast.success("✨ Menu translated to Spanish");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : formatSupabaseError(err);
      setError(message);
      toast.error(message);
    } finally {
      setTranslating(false);
    }
  }

  if (loading) {
    return <MenuBuilderSkeleton />;
  }

  return (
    <div className="air-page">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="air-page-title">Menu Builder</h1>
          <p className="air-page-subtitle">
            Sections → Categories → Dishes. Tab to price, Enter to save.
          </p>
        </div>
        {tree.sections.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => void handleTranslateMenu()}
            disabled={busy || translating}
          >
            {translating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Translate Menu to Spanish
          </Button>
        )}
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
        <div className="air-card air-card-pad flex flex-col items-center py-20 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5F5F7]">
            <Layers className="h-8 w-8 text-[#C7C7CC]" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Welcome to your menu builder!</h2>
          <p className="mt-2 max-w-sm text-sm text-[#86868B]">
            Create your first section to get started. Sections organize your menu into groups like
            Food, Drinks, or Desserts.
          </p>
          <Button
            variant="dark"
            size="lg"
            className="mt-8 gap-2"
            onClick={() => setAddingSection(true)}
            disabled={busy || tree.sections.length >= MAX_SECTIONS}
          >
            <Plus className="h-4 w-4" />
            Add Section
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <CapsuleNav
              items={(tree.sections ?? [])
                .filter((section): section is MenuBuilderSection => Boolean(section?.id))
                .map((section) => ({
                  id: section.id,
                  label: `${resolveLocalizedText(section.name, "en") || "Section"} (${section.categories?.length ?? 0})`,
                }))}
              active={activeSection?.id ?? tree.sections?.[0]?.id ?? ""}
              onChange={(sectionId) => {
                if (sectionId) setActiveSectionId(sectionId);
              }}
              ariaLabel="Menu sections"
              className="min-w-0 flex-1"
            />
            {tree.sections.length > 1 && activeSection?.id && (
              <ReorderButtons
                onMoveUp={() => handleReorderSection(activeSection.id, -1)}
                onMoveDown={() => handleReorderSection(activeSection.id, 1)}
                canMoveUp={activeSectionIndex > 0}
                canMoveDown={
                  activeSectionIndex >= 0 && activeSectionIndex < (tree.sections?.length ?? 0) - 1
                }
                disabled={busy}
              />
            )}
            <Button
              variant="dark"
              size="sm"
              className="shrink-0 gap-2"
              onClick={() => setAddingSection(true)}
              disabled={busy || tree.sections.length >= MAX_SECTIONS}
            >
              <Plus className="h-4 w-4" />
              Add Section
            </Button>
          </div>

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
                    disabled={busy || (activeSection.categories?.length ?? 0) >= MAX_CATEGORIES_PER_SECTION}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#E5E5EA] bg-white py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-white disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add Category
                  </button>
                )}
              </div>

              {(activeSection.categories?.length ?? 0) === 0 ? (
                <div className="air-card air-card-pad py-10 text-center text-sm text-[#86868B]">
                  No categories yet. Use the button above to add Starters, Mains, Desserts…
                </div>
              ) : (
                (activeSection.categories ?? [])
                  .filter((category): category is MenuBuilderCategory => Boolean(category?.id))
                  .map((category, categoryIndex) => (
                  <CategoryBlock
                    key={category.id}
                    categoryId={category.id}
                    category={category}
                    categoryIndex={categoryIndex}
                    categoryCount={activeSection.categories?.length ?? 0}
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
                      handleReorderCategory(activeSection?.id, category?.id, direction)
                    }
                    onMoveDish={(dishId, direction) =>
                      handleReorderDish(category?.id, dishId, direction)
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
        restaurantName={currentRestaurant?.name ?? ""}
        categoryName={resolveLocalizedText(selectedCategory?.name, "en")}
        onClose={() => setSelectedDish(null)}
        onSave={handleSaveDishDetail}
        onImageUpload={handleImageUpload}
        onAvailabilityChange={handleAvailabilityChange}
      />
    </div>
  );
}

function CategoryBlock({
  categoryId,
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
  categoryId: string;
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
  const [noteDraft, setNoteDraft] = useState(resolveLocalizedText(category.description, "en"));

  useEffect(() => {
    setNoteDraft(resolveLocalizedText(category.description, "en"));
  }, [category.id, category.description]);

  async function handleQuickAdd() {
    await onRapidAdd();
    nameRef.current?.focus();
  }

  return (
    <div id={categoryCardId(categoryId)} className="air-card overflow-hidden scroll-mt-24">
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
          <span className="shrink-0 text-xs text-[#86868B]">{category.dishes?.length ?? 0} dishes</span>
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
            aria-label={`Duplicate ${resolveLocalizedText(category.name, "en")}`}
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
            const saved = resolveLocalizedText(category.description, "en").trim();
            if (trimmed !== saved) {
              void onNoteChange(trimmed);
            }
          }}
          className="air-input"
        />
      </div>

      <div className="divide-y divide-[#F5F5F7]">
        {(category.dishes ?? []).map((dish, dishIndex) => (
          <div
            key={dish?.id ?? dishIndex}
            role="button"
            tabIndex={0}
            onClick={() => dish && onOpenDish(dish)}
            onKeyDown={(e) => (e.key === "Enter" && dish ? onOpenDish(dish) : undefined)}
            className={cn(
              "air-list-row group flex cursor-pointer items-center gap-3 px-5 py-4",
              dish?.is_available === false && "opacity-60"
            )}
          >
            <ReorderButtons
              onMoveUp={() => dish?.id && onMoveDish(dish.id, -1)}
              onMoveDown={() => dish?.id && onMoveDish(dish.id, 1)}
              canMoveUp={dishIndex > 0}
              canMoveDown={dishIndex < (category.dishes?.length ?? 0) - 1}
              disabled={busy}
              className="opacity-0 transition-opacity group-hover:opacity-100"
            />
            {dish?.image_url ? (
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
                <p className="truncate font-medium text-slate-900">
                  {resolveLocalizedText(dish?.name, "en") || "Untitled dish"}
                </p>
                {dish?.is_available === false && (
                  <span className="air-badge shrink-0">Hidden</span>
                )}
              </div>
              {dish?.description ? (
                <p className="truncate text-xs text-[#86868B]">
                  {resolveLocalizedText(dish.description, "en")}
                </p>
              ) : (
                <p className="text-xs text-[#86868B]">Tap to add photo, description, and tags</p>
              )}
            </div>
            <p className="font-semibold text-slate-900">€{(dish?.price ?? 0).toFixed(2)}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (dish) onDuplicateDish(dish);
              }}
              disabled={busy || !dish}
              aria-label={`Duplicate ${resolveLocalizedText(dish?.name, "en") || "dish"}`}
              className="rounded-lg p-1 text-[#C7C7CC] opacity-0 hover:text-slate-600 group-hover:opacity-100 disabled:opacity-40"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (dish) onDeleteDish(dish);
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
