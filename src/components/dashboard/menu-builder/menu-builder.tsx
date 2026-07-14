"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { Plus, Trash2, LayoutGrid, Layers, Copy, Loader2, GripVertical, Menu, ArrowUpDown } from "lucide-react";
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
import {
  MAX_CATEGORIES_PER_SECTION,
  MAX_CATEGORY_NAME,
  MAX_DISH_DESCRIPTION,
  MAX_DISH_NAME,
  MAX_SECTIONS,
  MAX_SECTION_TITLE,
  clampMenuText,
} from "@/lib/menu-limits";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { MenuBuilderSkeleton } from "@/components/ui/skeleton";
import { parsePriceInput } from "@/lib/price-input";
import { cn } from "@/lib/utils";
import { DishDetailSheet, type DishDetailDraft } from "./dish-detail-sheet";
import { DishDetailInspector } from "./dish-detail-inspector";
import { DishRow } from "./dish-row";
import { draftToStoredPriceVariations } from "./use-dish-detail-draft";
import { LocalizedTitleEditor } from "./localized-title-editor";
import { CapsuleNav } from "@/components/dashboard/capsule-nav";
import { useDashboardLocale } from "@/contexts/dashboard-locale-context";
import { ReorderButtons, moveByIndex } from "./reorder-buttons";
import { BuilderContextActionsSheet } from "./builder-context-actions-sheet";
import { BuilderRowMoreButton } from "./builder-row-more-button";
import type { BuilderContextTarget } from "./builder-context-target";
import { computeNextDishDisplayOrder } from "@/lib/menu-dish-order";
import {
  mergeLocalizedText,
  resolveBuilderSourceText,
  type LocalizedTextValue,
} from "@/lib/localized-text";
import type { MenuContentLanguage } from "@/lib/menu-content-languages";
import { getSecondaryLanguage, normalizePrimaryLanguage } from "@/lib/menu-content-languages";
import { useTouchLayout } from "@/hooks/use-touch-layout";
import { CategoryListPanel } from "./category-list-panel";
import { CategorySlideOver } from "./category-slide-over";

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
  rapidDrafts: Record<string, string>;
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
  const normalizedRapidDrafts: Record<string, string> = {};
  for (const [key, value] of Object.entries(rapidDrafts)) {
    if (typeof value === "string") {
      normalizedRapidDrafts[key] = value;
    } else if (value && typeof value === "object" && typeof (value as { name?: string }).name === "string") {
      normalizedRapidDrafts[key] = (value as { name: string }).name;
    }
  }

  return {
    rapidDrafts: normalizedRapidDrafts,
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

export function MenuBuilder() {
  const { currentRestaurant } = useRestaurant();
  const { t } = useDashboardLocale();
  const primaryLanguage = normalizePrimaryLanguage(currentRestaurant?.primary_language);
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
    updater: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)
  ) => {
    setFormDrafts((prev) => ({
      ...prev,
      rapidDrafts: typeof updater === "function" ? updater(prev?.rapidDrafts ?? {}) : updater,
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
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [duplicatingCategoryId, setDuplicatingCategoryId] = useState<string | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [categoryPanelOpen, setCategoryPanelOpen] = useState(false);
  const [contextTarget, setContextTarget] = useState<BuilderContextTarget | null>(null);
  const touchLayout = useTouchLayout();

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

  const activeCategory = useMemo(() => {
    if (!activeCategoryId || !activeSection) return null;
    return (
      (activeSection.categories ?? []).find((category) => category?.id === activeCategoryId) ??
      null
    );
  }, [activeSection, activeCategoryId]);

  const activeCategoryIndex = useMemo(() => {
    if (!activeCategoryId || !activeSection) return -1;
    return (activeSection.categories ?? []).findIndex(
      (category) => category?.id === activeCategoryId
    );
  }, [activeSection, activeCategoryId]);

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

  useEffect(() => {
    const categories = activeSection?.categories ?? [];
    if (categories.length === 0) {
      setActiveCategoryId(null);
      return;
    }
    if (!activeCategoryId || !categories.some((category) => category?.id === activeCategoryId)) {
      setActiveCategoryId(categories[0]?.id ?? null);
    }
  }, [activeSection?.id, activeSection?.categories, activeCategoryId]);

  useEffect(() => {
    if (!selectedDish) return;
    const category = findCategory(tree, selectedDish.categoryId);
    const freshDish = category?.dishes?.find((dish) => dish?.id === selectedDish.dish.id);
    if (freshDish && freshDish !== selectedDish.dish) {
      setSelectedDish((prev) => (prev ? { ...prev, dish: freshDish } : null));
    }
  }, [tree, selectedDish?.categoryId, selectedDish?.dish.id]);

  useEffect(() => {
    if (!touchLayout.touchOptimized || !reorderMode) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [touchLayout.touchOptimized, reorderMode]);

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
        clampMenuText(newSectionName, MAX_SECTION_TITLE),
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
    const message = `Delete section "${resolveBuilderSourceText(section.name, primaryLanguage)}" and all ${categories} categories with ${dishes} dishes? This cannot be undone.`;
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
        clampMenuText(newCategoryName, MAX_CATEGORY_NAME),
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
    const message = `Delete category "${resolveBuilderSourceText(category.name, primaryLanguage)}" and its ${category.dishes.length} dishes?`;
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
    const name = rapidDrafts[categoryId]?.trim();
    if (!name) return;

    const existingDishes = findCategory(tree, categoryId)?.dishes ?? [];
    const displayOrder = computeNextDishDisplayOrder(existingDishes);

    setBusy(true);
    try {
      const created = await createMenuDish(
        categoryId,
        clampMenuText(name, MAX_DISH_NAME),
        "",
        0,
        null,
        [],
        [],
        false,
        { displayOrder }
      );
      setTree((prev) =>
        addDishToCategory(prev, categoryId, { ...created, display_order: displayOrder })
      );
      setRapidDrafts((prev) => ({ ...prev, [categoryId]: "" }));
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

  async function handleInlineDishNameUpdate(
    dish: MenuBuilderDish,
    categoryId: string,
    nextName: string
  ): Promise<boolean> {
    const trimmed = clampMenuText(nextName, MAX_DISH_NAME);
    if (!trimmed) return false;

    const currentName = resolveBuilderSourceText(dish.name, primaryLanguage).trim();
    if (trimmed === currentName) return true;

    const mergedName = mergeLocalizedText(dish.name, primaryLanguage, trimmed, primaryLanguage);
    const previousTree = tree;
    setTree((prev) => updateDishInCategory(prev, categoryId, dish.id, { name: mergedName }));

    try {
      await updateMenuDish(
        dish.id,
        mergedName,
        dish.description,
        dish.price,
        dish.image_url,
        dish.tags ?? [],
        dish.allergens ?? [],
        dish.is_available,
        dish.hide_price,
        dish.lock_title_translation,
        dish.price_variations
      );
      return true;
    } catch (err) {
      setTree(previousTree);
      toast.error(formatSupabaseError(err));
      return false;
    }
  }

  async function handleInlineDishPriceUpdate(
    dish: MenuBuilderDish,
    categoryId: string,
    nextPrice: string
  ): Promise<boolean> {
    const resolvedPrice = parsePriceInput(nextPrice);
    if (resolvedPrice === dish.price) return true;

    const previousTree = tree;
    setTree((prev) =>
      updateDishInCategory(prev, categoryId, dish.id, { price: resolvedPrice })
    );

    try {
      await updateMenuDish(
        dish.id,
        dish.name,
        dish.description,
        resolvedPrice,
        dish.image_url,
        dish.tags ?? [],
        dish.allergens ?? [],
        dish.is_available,
        dish.hide_price,
        dish.lock_title_translation,
        dish.price_variations
      );
      return true;
    } catch (err) {
      setTree(previousTree);
      toast.error(formatSupabaseError(err));
      return false;
    }
  }

  async function handleSaveDishDetail(draft: DishDetailDraft) {
    if (!selectedDish) return;
    const { dish, categoryId } = selectedDish;
    const previousTree = tree;

    const secondaryLanguage = getSecondaryLanguage(primaryLanguage);
    const primaryName = clampMenuText(draft.name, MAX_DISH_NAME);
    const secondaryName = clampMenuText(draft.nameTranslation, MAX_DISH_NAME);
    const primaryDescription = clampMenuText(draft.description, MAX_DISH_DESCRIPTION);
    const secondaryDescription = clampMenuText(draft.descriptionTranslation, MAX_DISH_DESCRIPTION);

    let mergedName = mergeLocalizedText(dish.name, primaryLanguage, primaryName, primaryLanguage);
    mergedName = mergeLocalizedText(mergedName, secondaryLanguage, secondaryName, primaryLanguage);
    let mergedDescription = mergeLocalizedText(
      dish.description,
      primaryLanguage,
      primaryDescription,
      primaryLanguage
    );
    mergedDescription = mergeLocalizedText(
      mergedDescription,
      secondaryLanguage,
      secondaryDescription,
      primaryLanguage
    );

    const storedVariations = draftToStoredPriceVariations(draft);
    const resolvedPrice = storedVariations?.length
      ? storedVariations[0].price
      : parsePriceInput(draft.price);

    const optimisticDish: MenuBuilderDish = {
      ...dish,
      name: mergedName,
      description: mergedDescription,
      price: resolvedPrice,
      price_variations: storedVariations ?? [],
      image_url: draft.image_url,
      tags: draft.filterableTags,
      allergens: draft.allergens,
      is_available: draft.is_available,
      hide_price: draft.hide_price,
      lock_title_translation: draft.lock_title_translation,
    };

    setTree((prev) => updateDishInCategory(prev, categoryId, dish.id, optimisticDish));
    setSelectedDish({ dish: optimisticDish, categoryId });
    setBusy(true);
    try {
      await updateMenuDish(
        dish.id,
        optimisticDish.name,
        optimisticDish.description,
        resolvedPrice,
        draft.image_url,
        draft.filterableTags,
        draft.allergens,
        draft.is_available,
        draft.hide_price,
        draft.lock_title_translation,
        storedVariations
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

  async function handleToggleDishVisibility(dish: MenuBuilderDish, categoryId: string) {
    const isAvailable = !dish.is_available;
    const previousTree = tree;

    if (selectedDish?.dish.id === dish.id) {
      setSelectedDish((prev) =>
        prev ? { ...prev, dish: { ...prev.dish, is_available: isAvailable } } : null
      );
    }
    setTree((prev) =>
      updateDishInCategory(prev, categoryId, dish.id, { is_available: isAvailable })
    );

    try {
      await updateMenuDishAvailability(dish.id, isAvailable);
      toast.success(
        isAvailable ? "Dish is now visible on your menu" : "Dish hidden from public menu"
      );
    } catch (err) {
      setTree(previousTree);
      if (selectedDish?.dish.id === dish.id) {
        setSelectedDish((prev) =>
          prev ? { ...prev, dish: { ...prev.dish, is_available: !isAvailable } } : null
        );
      }
      const message = formatSupabaseError(err);
      setError(message);
      toast.error(message);
    }
  }

  async function handleDeleteDish(dish: MenuBuilderDish, categoryId: string) {
    if (!confirm(`Delete "${resolveBuilderSourceText(dish.name, primaryLanguage)}"?`)) return;

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
      toast.success(`"${resolveBuilderSourceText(dish.name, primaryLanguage)}" duplicated`);
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
    const mergedDescription = mergeLocalizedText(
      currentDescription,
      primaryLanguage,
      trimmed,
      primaryLanguage
    );

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
    const trimmed = clampMenuText(nextName, MAX_SECTION_TITLE);
    if (!trimmed) {
      toast.error("Category name cannot be empty");
      return false;
    }
    if (trimmed === resolveBuilderSourceText(currentName, primaryLanguage).trim()) {
      return true;
    }

    const mergedName = mergeLocalizedText(currentName, primaryLanguage, trimmed, primaryLanguage);
    const previousTree = tree;
    setTree((prev) => renameCategoryInTree(prev, id, mergedName));

    try {
      await updateMenuCategory(id, { name: mergedName });
      return true;
    } catch (err) {
      setTree(previousTree);
      const message = formatSupabaseError(err);
      setError(message);
      toast.error(message);
      return false;
    }
  }

  async function handleUpdateNameTranslation(
    id: string,
    currentName: LocalizedTextValue,
    lang: MenuContentLanguage,
    nextText: string
  ) {
    const trimmed = clampMenuText(nextText, MAX_SECTION_TITLE);
    const mergedName = mergeLocalizedText(currentName, lang, trimmed, primaryLanguage);
    const previousTree = tree;
    setTree((prev) => renameCategoryInTree(prev, id, mergedName));

    try {
      await updateMenuCategory(id, { name: mergedName });
    } catch (err) {
      setTree(previousTree);
      const message = formatSupabaseError(err);
      setError(message);
      toast.error(message);
      throw err;
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

  if (loading) {
    return <MenuBuilderSkeleton />;
  }

  function openDishActions(dish: MenuBuilderDish, categoryId: string) {
    setContextTarget({
      kind: "dish",
      dish,
      categoryId,
      title: resolveBuilderSourceText(dish.name, primaryLanguage) || "Untitled dish",
    });
  }

  function openCategoryActions(category: MenuBuilderCategory) {
    setContextTarget({
      kind: "category",
      category,
      categoryId: category.id,
      title: resolveBuilderSourceText(category.name, primaryLanguage) || "Category",
    });
  }

  function openSectionActions(section: MenuBuilderSection) {
    setContextTarget({
      kind: "section",
      section,
      sectionId: section.id,
      title: resolveBuilderSourceText(section.name, primaryLanguage) || "Section",
    });
  }

  function handleSelectDish(dish: MenuBuilderDish, categoryId: string) {
    setSelectedDish({ dish, categoryId });
  }

  function handleCloseInspector() {
    setSelectedDish(null);
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <header className="rounded-2xl border border-neutral-200/60 bg-gradient-to-br from-white via-white to-amber-50/40 px-6 py-7 shadow-sm shadow-neutral-200/30 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              {t("builder.pageTitle")}
            </h1>
            <p className="mt-2 text-base leading-relaxed text-neutral-600">
              {t("builder.pageSubtitle")}
            </p>
          </div>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {addingSection && (
        <div className="flex gap-2 rounded-2xl border border-neutral-200/60 bg-white p-4">
          <input
            autoFocus
            placeholder="Section name (e.g. Food, Drinks)"
            value={newSectionName}
            maxLength={MAX_SECTION_TITLE}
            onChange={(e) => setNewSectionName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddSection()}
            className="flex-1 rounded-xl border border-neutral-200/60 bg-white px-3 py-2.5 text-sm transition-all duration-200 ease-in-out focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200/80"
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
        <div className="flex flex-col items-center rounded-2xl border border-neutral-200/60 bg-white py-20 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
            <Layers className="h-8 w-8 text-amber-400/80" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-800">
            Welcome to your menu builder!
          </h2>
          <p className="mt-2 max-w-sm text-sm text-neutral-500">
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
                  label: `${resolveBuilderSourceText(section.name, primaryLanguage) || "Section"} (${section.categories?.length ?? 0})`,
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
                revealOnHover
                mobileEnabled={reorderMode}
                onMoveUp={() => handleReorderSection(activeSection.id, -1)}
                onMoveDown={() => handleReorderSection(activeSection.id, 1)}
                canMoveUp={activeSectionIndex > 0}
                canMoveDown={
                  activeSectionIndex >= 0 && activeSectionIndex < (tree.sections?.length ?? 0) - 1
                }
                disabled={busy}
              />
            )}
            {activeSection?.id && (
              <Button
                size="sm"
                variant="ghost"
                className="hidden shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600 lg:inline-flex"
                onClick={() => handleDeleteSection(activeSection)}
                disabled={busy}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete section
              </Button>
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
            <div className="rounded-3xl bg-slate-50/50 p-4 md:p-6">
              <MobileCategoryStrip
                activeSection={activeSection}
                activeCategoryId={activeCategoryId}
                primaryLanguage={primaryLanguage}
                busy={busy}
                onSelectCategory={setActiveCategoryId}
                onStartAddCategory={() => setAddingCategoryForSection(activeSection.id)}
              />

              <div
                className={cn(
                  "grid items-start gap-5",
                  touchLayout.useTwoColumn
                    ? "lg:mt-0 lg:grid-cols-[minmax(200px,25%)_minmax(0,75%)] lg:gap-6"
                    : "mt-4 grid-cols-1"
                )}
              >
                {touchLayout.useTwoColumn && (
                  <CategorySidebar
                    activeSection={activeSection}
                    activeCategoryId={activeCategoryId}
                    primaryLanguage={primaryLanguage}
                    busy={busy}
                    reorderMode={reorderMode}
                    addingCategory={addingCategoryForSection === activeSection.id}
                    newCategoryName={newCategoryName}
                    onSelectCategory={setActiveCategoryId}
                    onNewCategoryNameChange={setNewCategoryName}
                    onStartAddCategory={() => setAddingCategoryForSection(activeSection.id)}
                    onCancelAddCategory={() => setAddingCategoryForSection(null)}
                    onAddCategory={() => handleAddCategory(activeSection.id)}
                    onMoveCategory={(categoryId, direction) =>
                      handleReorderCategory(activeSection.id, categoryId, direction)
                    }
                  />
                )}

              {activeCategory ? (
                <DishesCanvas
                  category={activeCategory}
                  categoryIndex={activeCategoryIndex}
                  categoryCount={activeSection.categories?.length ?? 0}
                  primaryLanguage={primaryLanguage}
                  busy={busy}
                  duplicating={duplicatingCategoryId === activeCategory.id}
                  rapidDraft={rapidDrafts[activeCategory.id] ?? ""}
                  selectedDishId={selectedDish?.dish.id ?? null}
                  reorderMode={reorderMode}
                  touchOptimized={touchLayout.touchOptimized}
                  onToggleReorderMode={() => setReorderMode((current) => !current)}
                  onRapidDraftChange={(draft) =>
                    setRapidDrafts((prev) => ({ ...prev, [activeCategory.id]: draft }))
                  }
                  onRapidAdd={() => handleRapidAddDish(activeCategory.id)}
                  onInlineDishNameUpdate={(dish, nextName) =>
                    handleInlineDishNameUpdate(dish, activeCategory.id, nextName)
                  }
                  onInlineDishPriceUpdate={(dish, nextPrice) =>
                    handleInlineDishPriceUpdate(dish, activeCategory.id, nextPrice)
                  }
                  onDeleteCategory={() => handleDeleteCategory(activeSection.id, activeCategory)}
                  onDuplicateCategory={() =>
                    handleDuplicateCategory(activeSection.id, activeCategory)
                  }
                  onDeleteDish={(dish) => handleDeleteDish(dish, activeCategory.id)}
                  onDuplicateDish={(dish) => handleDuplicateDish(dish, activeCategory.id)}
                  onSelectDish={(dish) => handleSelectDish(dish, activeCategory.id)}
                  onToggleVisibility={(dish) =>
                    handleToggleDishVisibility(dish, activeCategory.id)
                  }
                  onLayoutChange={(layout) => handleLayoutChange(activeCategory, layout)}
                  onNoteChange={(note) => handleCategoryNoteChange(activeCategory.id, note)}
                  onRename={(nextName) =>
                    handleRenameCategory(activeCategory.id, activeCategory.name, nextName)
                  }
                  onTranslationChange={(lang, nextText) =>
                    handleUpdateNameTranslation(activeCategory.id, activeCategory.name, lang, nextText)
                  }
                  onMoveCategory={(direction) =>
                    handleReorderCategory(activeSection.id, activeCategory.id, direction)
                  }
                  onMoveDish={(dishId, direction) =>
                    handleReorderDish(activeCategory.id, dishId, direction)
                  }
                  onOpenCategoryActions={() => openCategoryActions(activeCategory)}
                  onOpenDishActions={(dish) => openDishActions(dish, activeCategory.id)}
                />
              ) : (
                <div className="rounded-2xl border border-neutral-200/60 bg-white p-10 text-center text-sm text-neutral-500">
                  No categories yet. Add one from the sidebar.
                </div>
              )}
              </div>

              {touchLayout.showTabletCategoryTrigger && activeSection && (
                <button
                  type="button"
                  onClick={() => setCategoryPanelOpen(true)}
                  className="fixed bottom-6 left-6 z-30 inline-flex min-h-12 items-center gap-2 rounded-full border border-neutral-200/60 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 shadow-lg shadow-neutral-300/30 transition-all duration-200 ease-in-out hover:border-sky-200 hover:bg-sky-50 active:scale-[0.98] md:flex lg:hidden"
                >
                  <Menu className="h-4 w-4" />
                  {t("builder.categoriesMenu")}
                </button>
              )}

              <CategorySlideOver
                open={categoryPanelOpen}
                onClose={() => setCategoryPanelOpen(false)}
                title={t("builder.categoriesMenu")}
              >
                <CategoryListPanel
                  activeSection={activeSection}
                  activeCategoryId={activeCategoryId}
                  primaryLanguage={primaryLanguage}
                  busy={busy}
                  reorderMode={reorderMode}
                  addingCategory={addingCategoryForSection === activeSection.id}
                  newCategoryName={newCategoryName}
                  onSelectCategory={(categoryId) => {
                    setActiveCategoryId(categoryId);
                    setCategoryPanelOpen(false);
                  }}
                  onNewCategoryNameChange={setNewCategoryName}
                  onStartAddCategory={() => setAddingCategoryForSection(activeSection.id)}
                  onCancelAddCategory={() => setAddingCategoryForSection(null)}
                  onAddCategory={() => handleAddCategory(activeSection.id)}
                  onMoveCategory={(categoryId, direction) =>
                    handleReorderCategory(activeSection.id, categoryId, direction)
                  }
                />
              </CategorySlideOver>
            </div>
          )}
        </>
      )}

      {selectedDish && (
        <div className="fixed inset-0 z-50 hidden md:block">
          <button
            type="button"
            aria-label="Close editor"
            className="absolute inset-0 bg-neutral-900/20 backdrop-blur-[1px] transition-opacity"
            onClick={handleCloseInspector}
          />
          <DishDetailInspector
            className="absolute inset-y-0 right-0 flex w-[min(420px,100vw)] animate-in slide-in-from-right duration-300"
            dish={selectedDish.dish}
            primaryLanguage={primaryLanguage}
            saving={busy}
            uploadingImage={uploadingImage}
            restaurantName={currentRestaurant?.name ?? ""}
            categoryName={resolveBuilderSourceText(selectedCategory?.name, primaryLanguage)}
            onClose={handleCloseInspector}
            onSave={handleSaveDishDetail}
            onImageUpload={handleImageUpload}
            onAvailabilityChange={handleAvailabilityChange}
          />
        </div>
      )}

      <div className="md:hidden">
        <DishDetailSheet
          open={Boolean(selectedDish)}
          dish={selectedDish?.dish ?? null}
          primaryLanguage={primaryLanguage}
          saving={busy}
          uploadingImage={uploadingImage}
          restaurantName={currentRestaurant?.name ?? ""}
          categoryName={resolveBuilderSourceText(selectedCategory?.name, primaryLanguage)}
          onClose={handleCloseInspector}
          onSave={handleSaveDishDetail}
          onImageUpload={handleImageUpload}
          onAvailabilityChange={handleAvailabilityChange}
        />
      </div>

      <BuilderContextActionsSheet
        target={contextTarget}
        onClose={() => setContextTarget(null)}
        busy={busy}
        onEditDish={(target) => {
          setSelectedDish({ dish: target.dish, categoryId: target.categoryId });
        }}
        onToggleDishVisibility={(target) => {
          void handleToggleDishVisibility(target.dish, target.categoryId);
        }}
        onDuplicate={(target) => {
          if (target.kind === "dish") {
            void handleDuplicateDish(target.dish, target.categoryId);
            return;
          }
          if (target.kind === "category" && activeSection) {
            void handleDuplicateCategory(activeSection.id, target.category);
          }
        }}
        onDelete={(target) => {
          if (target.kind === "dish") {
            void handleDeleteDish(target.dish, target.categoryId);
            return;
          }
          if (target.kind === "category" && activeSection) {
            void handleDeleteCategory(activeSection.id, target.category);
            return;
          }
          if (target.kind === "section") {
            void handleDeleteSection(target.section);
          }
        }}
        onLayoutChange={(target, layout) => {
          void handleLayoutChange(target.category, layout);
        }}
      />
    </div>
  );
}

function MobileCategoryStrip({
  activeSection,
  activeCategoryId,
  primaryLanguage,
  busy,
  onSelectCategory,
  onStartAddCategory,
}: {
  activeSection: MenuBuilderSection;
  activeCategoryId: string | null;
  primaryLanguage: MenuContentLanguage;
  busy: boolean;
  onSelectCategory: (categoryId: string) => void;
  onStartAddCategory: () => void;
}) {
  const categories = (activeSection.categories ?? []).filter(
    (category): category is MenuBuilderCategory => Boolean(category?.id)
  );

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
      {categories.map((category) => {
        const isActive = category.id === activeCategoryId;
        const label = resolveBuilderSourceText(category.name, primaryLanguage) || "Category";
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out",
              isActive
                ? "border-sky-200 bg-sky-50 text-sky-800"
                : "border-neutral-200/60 bg-white text-neutral-700 hover:bg-neutral-50"
            )}
          >
            {label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                isActive ? "bg-sky-100 text-sky-700" : "bg-neutral-100 text-neutral-500"
              )}
            >
              {category.dishes?.length ?? 0}
            </span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={onStartAddCategory}
        disabled={busy || categories.length >= MAX_CATEGORIES_PER_SECTION}
        className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
      >
        <Plus className="h-4 w-4" />
        Add Category
      </button>
    </div>
  );
}

function CategorySidebar(props: ComponentProps<typeof CategoryListPanel>) {
  return (
    <nav
      aria-label="Categories"
      className="hidden overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-sm shadow-neutral-200/20 lg:flex lg:flex-col lg:self-start"
    >
      <CategoryListPanel {...props} />
    </nav>
  );
}

function DishesCanvas({
  category,
  categoryIndex,
  categoryCount,
  primaryLanguage,
  busy,
  duplicating,
  rapidDraft,
  selectedDishId,
  reorderMode,
  touchOptimized,
  onToggleReorderMode,
  onRapidDraftChange,
  onRapidAdd,
  onDeleteCategory,
  onDuplicateCategory,
  onDeleteDish,
  onDuplicateDish,
  onSelectDish,
  onToggleVisibility,
  onLayoutChange,
  onNoteChange,
  onRename,
  onTranslationChange,
  onMoveCategory,
  onMoveDish,
  onInlineDishNameUpdate,
  onInlineDishPriceUpdate,
  onOpenCategoryActions,
  onOpenDishActions,
}: {
  category: MenuBuilderCategory;
  categoryIndex: number;
  categoryCount: number;
  primaryLanguage: MenuContentLanguage;
  busy: boolean;
  duplicating: boolean;
  rapidDraft: string;
  selectedDishId: string | null;
  reorderMode: boolean;
  touchOptimized: boolean;
  onToggleReorderMode: () => void;
  onRapidDraftChange: (draft: string) => void;
  onRapidAdd: () => Promise<void>;
  onDeleteCategory: () => void;
  onDuplicateCategory: () => void;
  onDeleteDish: (dish: MenuBuilderDish) => void;
  onDuplicateDish: (dish: MenuBuilderDish) => void;
  onSelectDish: (dish: MenuBuilderDish) => void;
  onToggleVisibility: (dish: MenuBuilderDish) => void;
  onLayoutChange: (layout: "stacked" | "carousel") => void;
  onNoteChange: (note: string) => void;
  onRename: (nextName: string) => Promise<boolean>;
  onTranslationChange: (lang: MenuContentLanguage, nextText: string) => Promise<void>;
  onMoveCategory: (direction: -1 | 1) => void;
  onMoveDish: (dishId: string, direction: -1 | 1) => void;
  onInlineDishNameUpdate: (dish: MenuBuilderDish, nextName: string) => Promise<boolean>;
  onInlineDishPriceUpdate: (dish: MenuBuilderDish, nextPrice: string) => Promise<boolean>;
  onOpenCategoryActions: () => void;
  onOpenDishActions: (dish: MenuBuilderDish) => void;
}) {
  const { t } = useDashboardLocale();
  const rapidAddRef = useRef<HTMLInputElement>(null);
  const [noteDraft, setNoteDraft] = useState(
    resolveBuilderSourceText(category.description, primaryLanguage)
  );

  useEffect(() => {
    setNoteDraft(resolveBuilderSourceText(category.description, primaryLanguage));
  }, [category.id, category.description, primaryLanguage]);

  async function handleQuickAdd() {
    await onRapidAdd();
    rapidAddRef.current?.focus();
  }

  return (
    <div
      id={categoryCardId(category.id)}
      className="min-w-0 overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-sm shadow-neutral-200/20 transition-all duration-200 ease-in-out"
    >
      <div className="group flex items-center justify-between gap-3 border-b border-neutral-200/60 bg-white px-4 py-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {reorderMode ? (
            <GripVertical className="h-5 w-5 shrink-0 text-neutral-400 md:hidden" aria-hidden />
          ) : null}
          <ReorderButtons
            revealOnHover
            mobileEnabled={reorderMode}
            onMoveUp={() => onMoveCategory(-1)}
            onMoveDown={() => onMoveCategory(1)}
            canMoveUp={categoryIndex > 0}
            canMoveDown={categoryIndex < categoryCount - 1}
            disabled={busy || duplicating}
          />
          <LayoutGrid className="hidden h-4 w-4 shrink-0 text-neutral-500 lg:block" />
          <div className="min-w-0 flex-1">
            <LocalizedTitleEditor
              name={category.name}
              primaryLanguage={primaryLanguage}
              titleClassName="text-lg font-semibold text-neutral-800"
              maxLength={MAX_CATEGORY_NAME}
              disabled={busy || duplicating}
              onRename={onRename}
              onTranslationChange={onTranslationChange}
            />
          </div>
        </div>
        <span className="shrink-0 text-xs text-neutral-500 lg:hidden">
          {t("builder.dishesCount", { count: category.dishes?.length ?? 0 })}
        </span>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          {touchOptimized && (
            <button
              type="button"
              onClick={onToggleReorderMode}
              disabled={busy || duplicating}
              className={cn(
                "inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200 ease-in-out lg:hidden",
                reorderMode
                  ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                  : "border-neutral-200/60 bg-white text-neutral-700 hover:border-sky-200 hover:bg-sky-50"
              )}
            >
              <ArrowUpDown className="h-4 w-4" />
              {reorderMode ? t("builder.doneReordering") : t("builder.reorderDishes")}
            </button>
          )}
        <div className="hidden items-center gap-1 lg:flex">
          <div className="flex rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-0.5">
            {(["stacked", "carousel"] as const).map((layout) => (
              <button
                key={layout}
                type="button"
                onClick={() => onLayoutChange(layout)}
                className={cn(
                  "min-h-11 rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all duration-200 ease-in-out",
                  category.layout_type === layout
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-neutral-600 hover:bg-white"
                )}
              >
                {layout}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="min-h-11 min-w-11 text-neutral-500"
            onClick={onDuplicateCategory}
            disabled={busy || duplicating}
            aria-label={`Duplicate ${resolveBuilderSourceText(category.name, primaryLanguage)}`}
          >
            {duplicating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="min-h-11 min-w-11 text-red-500"
            onClick={onDeleteCategory}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        </div>
        <BuilderRowMoreButton
          className="lg:hidden"
          label={t("builder.actions.more")}
          disabled={busy || duplicating}
          onClick={onOpenCategoryActions}
        />
      </div>

      {touchOptimized && reorderMode && (
        <div className="sticky top-0 z-10 border-b border-emerald-200/80 bg-emerald-50 px-4 py-2.5 text-center lg:hidden">
          <p className="text-xs font-medium text-emerald-800">{t("builder.reorderModeHint")}</p>
          <button
            type="button"
            onClick={onToggleReorderMode}
            className="mt-1 inline-flex min-h-11 items-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
          >
            {t("builder.doneReordering")}
          </button>
        </div>
      )}

      <div className="border-b border-neutral-200/60 bg-neutral-50/40 px-4 py-3">
        <label className="mb-1.5 block text-xs text-neutral-400">
          {t("builder.categorySubtitle")}
        </label>
        <input
          type="text"
          value={noteDraft}
          disabled={busy}
          placeholder={t("builder.sectionNotePlaceholder")}
          onChange={(e) => setNoteDraft(e.target.value)}
          onBlur={() => {
            const trimmed = noteDraft.trim();
            const saved = resolveBuilderSourceText(category.description, primaryLanguage).trim();
            if (trimmed !== saved) {
              void onNoteChange(trimmed);
            }
          }}
          className="w-full rounded-xl border border-neutral-200/60 bg-white px-3 py-2.5 text-sm text-neutral-700 transition-all duration-200 ease-in-out placeholder:text-neutral-400 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200/80"
        />
      </div>

      <div
        className={cn(
          "bg-white",
          touchOptimized && reorderMode && "max-lg:max-h-[min(70vh,640px)] max-lg:overflow-y-auto max-lg:overscroll-contain"
        )}
      >
        {(category.dishes ?? []).map((dish, dishIndex) =>
          dish ? (
            <DishRow
              key={dish.id}
              dish={dish}
              primaryLanguage={primaryLanguage}
              busy={busy}
              selected={selectedDishId === dish.id}
              dishIndex={dishIndex}
              dishCount={category.dishes?.length ?? 0}
              reorderMode={reorderMode}
              touchOptimized={touchOptimized}
              onSelect={() => onSelectDish(dish)}
              onToggleVisibility={() => onToggleVisibility(dish)}
              onInlineNameUpdate={(nextName) => onInlineDishNameUpdate(dish, nextName)}
              onInlinePriceUpdate={(nextPrice) => onInlineDishPriceUpdate(dish, nextPrice)}
              onMoveDish={(direction) => onMoveDish(dish.id, direction)}
              editLabel={t("builder.actions.editDetails")}
              hiddenLabel={t("builder.hidden")}
              visibleLabel={t("builder.visible")}
              tapForDetailsLabel={t("builder.tapForDetails")}
            />
          ) : null
        )}

        {(category.dishes?.length ?? 0) === 0 && (
          <p className="px-4 py-8 text-center text-sm text-neutral-500">
            No dishes yet. Add one below.
          </p>
        )}

        <div className="border-t border-dashed border-neutral-200/60 bg-neutral-50/40 px-4 py-3">
          <input
            ref={rapidAddRef}
            placeholder={t("builder.rapidAddPlaceholder")}
            value={rapidDraft}
            maxLength={MAX_DISH_NAME}
            disabled={busy}
            onChange={(e) => onRapidDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleQuickAdd();
              }
            }}
            className="w-full rounded-xl border border-neutral-200/60 bg-white px-4 py-3.5 text-sm text-neutral-800 transition-all duration-200 ease-in-out placeholder:text-neutral-400 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200/80"
          />
        </div>
      </div>
    </div>
  );
}
