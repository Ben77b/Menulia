"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, ChevronRight, LayoutGrid, Layers, Copy, Loader2, GripVertical } from "lucide-react";
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
  MAX_CATEGORY_NAME,
  MAX_DISH_DESCRIPTION,
  MAX_DISH_NAME,
  MAX_SECTION_TITLE,
  clampMenuText,
} from "@/lib/menu-limits";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { MenuBuilderSkeleton } from "@/components/ui/skeleton";
import { parsePriceInput } from "@/lib/price-input";
import { cn } from "@/lib/utils";
import { DishDetailSheet, type DishDetailDraft } from "./dish-detail-sheet";
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
  const [reorderMode, setReorderMode] = useState(false);
  const [contextTarget, setContextTarget] = useState<BuilderContextTarget | null>(null);

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
    const draft = rapidDrafts[categoryId];
    if (!draft?.name.trim()) return;

    const existingDishes = findCategory(tree, categoryId)?.dishes ?? [];
    const displayOrder = computeNextDishDisplayOrder(existingDishes);

    setBusy(true);
    try {
      const created = await createMenuDish(
        categoryId,
        clampMenuText(draft.name, MAX_DISH_NAME),
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

    const resolvedPrice = draft.usePriceVariations
      ? parsePriceInput(
          draft.priceVariations.find((row) => row.price.trim())?.price ?? draft.price
        )
      : parsePriceInput(draft.price);

    const optimisticDish: MenuBuilderDish = {
      ...dish,
      name: mergedName,
      description: mergedDescription,
      price: resolvedPrice,
      image_url: draft.image_url,
      tags: draft.filterableTags,
      allergens: draft.allergens,
      is_available: draft.is_available,
      hide_price: draft.hide_price,
      lock_title_translation: draft.lock_title_translation,
    };

    setTree((prev) => updateDishInCategory(prev, categoryId, dish.id, optimisticDish));
    setSelectedDish(null);
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
        draft.lock_title_translation
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

  return (
    <div className="air-page">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="air-page-title">{t("builder.pageTitle")}</h1>
          <p className="air-page-subtitle">
            Sections → Categories → Dishes. Tab to price, Enter to save.
          </p>
        </div>
        {tree.sections.length > 0 && (
          <button
            type="button"
            onClick={() => setReorderMode((current) => !current)}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium transition-all md:hidden",
              reorderMode
                ? "border-[#22c55e] text-[#22c55e] shadow-[0_0_14px_rgba(34,197,94,0.35)]"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            )}
          >
            {reorderMode ? t("builder.reorderModeOn") : t("builder.reorderMode")}
          </button>
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
            maxLength={MAX_SECTION_TITLE}
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
              <div className="group flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <LocalizedTitleEditor
                    name={activeSection.name}
                    primaryLanguage={primaryLanguage}
                    titleClassName="air-section-title"
                    maxLength={MAX_SECTION_TITLE}
                    disabled={busy}
                    onRename={(nextName) =>
                      handleRenameCategory(activeSection.id, activeSection.name, nextName)
                    }
                    onTranslationChange={(lang, nextText) =>
                      handleUpdateNameTranslation(activeSection.id, activeSection.name, lang, nextText)
                    }
                  />
                  <p className="mt-1 text-xs text-[#86868B] md:hidden">
                    {t("builder.categoriesCount", {
                      count: activeSection.categories?.length ?? 0,
                    })}
                  </p>
                </div>
                <BuilderRowMoreButton
                  className="md:hidden"
                  label={t("builder.actions.more")}
                  disabled={busy}
                  onClick={() => openSectionActions(activeSection)}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="hidden shrink-0 text-red-600 hover:text-red-700 md:inline-flex"
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
                      maxLength={MAX_CATEGORY_NAME}
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
                    primaryLanguage={primaryLanguage}
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
                    onTranslationChange={(lang, nextText) =>
                      handleUpdateNameTranslation(category.id, category.name, lang, nextText)
                    }
                    onMoveCategory={(direction) =>
                      handleReorderCategory(activeSection?.id, category?.id, direction)
                    }
                    onMoveDish={(dishId, direction) =>
                      handleReorderDish(category?.id, dishId, direction)
                    }
                    reorderMode={reorderMode}
                    onOpenCategoryActions={() => openCategoryActions(category)}
                    onOpenDishActions={(dish) => openDishActions(dish, category.id)}
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
        primaryLanguage={primaryLanguage}
        saving={busy}
        uploadingImage={uploadingImage}
        restaurantName={currentRestaurant?.name ?? ""}
        categoryName={resolveBuilderSourceText(selectedCategory?.name, primaryLanguage)}
        onClose={() => setSelectedDish(null)}
        onSave={handleSaveDishDetail}
        onImageUpload={handleImageUpload}
        onAvailabilityChange={handleAvailabilityChange}
      />

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

function CategoryBlock({
  primaryLanguage,
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
  onTranslationChange,
  onMoveCategory,
  onMoveDish,
  reorderMode,
  onOpenCategoryActions,
  onOpenDishActions,
}: {
  primaryLanguage: MenuContentLanguage;
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
  onTranslationChange: (lang: MenuContentLanguage, nextText: string) => Promise<void>;
  onMoveCategory: (direction: -1 | 1) => void;
  onMoveDish: (dishId: string, direction: -1 | 1) => void;
  reorderMode: boolean;
  onOpenCategoryActions: () => void;
  onOpenDishActions: (dish: MenuBuilderDish) => void;
}) {
  const { t } = useDashboardLocale();
  const nameRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const [noteDraft, setNoteDraft] = useState(resolveBuilderSourceText(category.description, primaryLanguage));

  useEffect(() => {
    setNoteDraft(resolveBuilderSourceText(category.description, primaryLanguage));
  }, [category.id, category.description]);

  async function handleQuickAdd() {
    await onRapidAdd();
    nameRef.current?.focus();
  }

  return (
    <div id={categoryCardId(categoryId)} className="air-card overflow-hidden scroll-mt-24">
      <div className="group flex items-center justify-between gap-3 border-b border-[#F5F5F7]/80 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {reorderMode ? (
            <GripVertical className="h-5 w-5 shrink-0 text-slate-400 md:hidden" aria-hidden />
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
          <LayoutGrid className="hidden h-4 w-4 shrink-0 text-slate-500 opacity-80 transition-opacity group-hover:opacity-100 md:block" />
          <div className="min-w-0 flex-1">
            <LocalizedTitleEditor
              name={category.name}
              primaryLanguage={primaryLanguage}
              titleClassName="font-semibold text-slate-900"
              maxLength={MAX_CATEGORY_NAME}
              disabled={busy || duplicating}
              onRename={onRename}
              onTranslationChange={onTranslationChange}
            />
          </div>
        </div>
        <span className="shrink-0 text-xs text-[#86868B] md:hidden">
          {t("builder.dishesCount", { count: category.dishes?.length ?? 0 })}
        </span>
        <div className="hidden items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 md:flex">
          <span className="shrink-0 text-xs text-[#86868B]">
            {category.dishes?.length ?? 0} dishes
          </span>
          <div className="air-capsule-nav !w-auto p-0.5">
            {(["stacked", "carousel"] as const).map((layout) => (
              <button
                key={layout}
                type="button"
                onClick={() => onLayoutChange(layout)}
                className={cn(
                  "air-capsule-nav-item min-h-11 !px-4 !py-2 text-xs capitalize",
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
            className="min-h-11 min-w-11 text-slate-500 hover:text-slate-700"
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
        <BuilderRowMoreButton
          className="md:hidden"
          label={t("builder.actions.more")}
          disabled={busy || duplicating}
          onClick={onOpenCategoryActions}
        />
      </div>

      <div className="border-b border-[#F5F5F7]/80 px-6 py-4">
        <label className="mb-1.5 block text-xs font-medium text-slate-700">
          {t("builder.sectionNote")}
        </label>
        <input
          type="text"
          value={noteDraft}
          disabled={busy}
          placeholder='e.g. "Optional flamed" or "Served with miso soup"'
          onChange={(e) => setNoteDraft(e.target.value)}
          onBlur={() => {
            const trimmed = noteDraft.trim();
            const saved = resolveBuilderSourceText(category.description, primaryLanguage).trim();
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
              "air-list-row group flex cursor-pointer items-center gap-3 px-4 py-4 sm:px-5",
              dish?.is_available === false && "opacity-60"
            )}
          >
            {reorderMode ? (
              <GripVertical className="h-5 w-5 shrink-0 text-slate-400 md:hidden" aria-hidden />
            ) : null}
            <ReorderButtons
              revealOnHover
              mobileEnabled={reorderMode}
              onMoveUp={() => dish?.id && onMoveDish(dish.id, -1)}
              onMoveDown={() => dish?.id && onMoveDish(dish.id, 1)}
              canMoveUp={dishIndex > 0}
              canMoveDown={dishIndex < (category.dishes?.length ?? 0) - 1}
              disabled={busy}
            />
            {dish?.image_url ? (
              <img
                src={dish.image_url}
                alt=""
                className="hidden h-10 w-10 rounded-[10px] object-cover sm:block"
              />
            ) : (
              <div className="hidden h-10 w-10 rounded-[10px] bg-[#F5F5F7] sm:block" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="line-clamp-2 font-medium text-slate-900">
                  {resolveBuilderSourceText(dish?.name, primaryLanguage) || "Untitled dish"}
                </p>
                {dish?.is_available === false && (
                  <span className="air-badge shrink-0">{t("builder.hidden")}</span>
                )}
              </div>
              {dish?.description ? (
                <p className="hidden line-clamp-2 text-xs text-[#86868B] sm:block">
                  {resolveBuilderSourceText(dish.description, primaryLanguage)}
                </p>
              ) : (
                <p className="hidden text-xs text-[#86868B] sm:block">
                  Tap to add photo, description, and tags
                </p>
              )}
            </div>
            <p className="shrink-0 font-semibold text-slate-900">€{(dish?.price ?? 0).toFixed(2)}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (dish) onDuplicateDish(dish);
              }}
              disabled={busy || !dish}
              aria-label={`Duplicate ${resolveBuilderSourceText(dish?.name, primaryLanguage) || "dish"}`}
              className="hidden min-h-11 min-w-11 items-center justify-center rounded-lg text-[#C7C7CC] opacity-0 transition-opacity hover:text-slate-600 group-hover:opacity-100 md:inline-flex disabled:opacity-40"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (dish) onDeleteDish(dish);
              }}
              className="hidden min-h-11 min-w-11 items-center justify-center rounded-lg text-[#C7C7CC] opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 md:inline-flex"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <ChevronRight className="hidden h-4 w-4 text-[#C7C7CC] group-hover:text-slate-500 md:block" />
            {dish ? (
              <BuilderRowMoreButton
                className="md:hidden"
                label={t("builder.actions.more")}
                disabled={busy}
                onClick={() => onOpenDishActions(dish)}
              />
            ) : null}
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
                maxLength={MAX_DISH_NAME}
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
