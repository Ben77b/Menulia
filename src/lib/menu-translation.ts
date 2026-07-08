import type { MenuBuilderDish, MenuBuilderTree } from "./menu-builder-types";
import { findCategory } from "./menu-builder-mutations";
import { updateMenuCategory, updateMenuDish } from "./menu-db";
import type { MenuContentLanguage } from "./menu-content-languages";
import {
  deeplCodeToMenuLanguage,
  getMenuContentLanguageMeta,
} from "./menu-content-languages";
import {
  applyTranslationBrandProtection,
  collectTextForTranslation,
  mergeLocalizedText,
  stripTranslationBrandProtection,
  type LocalizedTextRecord,
  type LocalizedTextValue,
  type TranslationBrandProtectionOptions,
} from "./localized-text";

export type MenuTranslationField = "name" | "description";
export type MenuTranslationEntity = "category" | "dish";

export interface MenuTranslationItem {
  key: string;
  entityType: MenuTranslationEntity;
  entityId: string;
  field: MenuTranslationField;
  text: string;
}

function pushTranslationItem(
  items: MenuTranslationItem[],
  entityType: MenuTranslationEntity,
  entityId: string,
  field: MenuTranslationField,
  value: LocalizedTextValue,
  targetLang: MenuContentLanguage
) {
  const text = collectTextForTranslation(value, targetLang);
  if (!text) return;

  items.push({
    key: `${entityType}:${entityId}:${field}`,
    entityType,
    entityId,
    field,
    text,
  });
}

export function collectMenuTranslationItems(
  tree: MenuBuilderTree,
  targetLang: MenuContentLanguage
): MenuTranslationItem[] {
  const items: MenuTranslationItem[] = [];

  for (const section of tree.sections) {
    pushTranslationItem(items, "category", section.id, "name", section.name, targetLang);
    if (section.description) {
      pushTranslationItem(items, "category", section.id, "description", section.description, targetLang);
    }

    for (const category of section.categories) {
      pushTranslationItem(items, "category", category.id, "name", category.name, targetLang);
      if (category.description) {
        pushTranslationItem(items, "category", category.id, "description", category.description, targetLang);
      }

      for (const dish of category.dishes) {
        pushTranslationItem(items, "dish", dish.id, "name", dish.name, targetLang);
        pushTranslationItem(items, "dish", dish.id, "description", dish.description, targetLang);
      }
    }
  }

  for (const category of tree.orphanCategories) {
    pushTranslationItem(items, "category", category.id, "name", category.name, targetLang);
    if (category.description) {
      pushTranslationItem(items, "category", category.id, "description", category.description, targetLang);
    }

    for (const dish of category.dishes) {
      pushTranslationItem(items, "dish", dish.id, "name", dish.name, targetLang);
      pushTranslationItem(items, "dish", dish.id, "description", dish.description, targetLang);
    }
  }

  return items;
}

function findSection(tree: MenuBuilderTree, sectionId: string) {
  return tree.sections.find((section) => section.id === sectionId);
}

function getCategoryFieldValue(
  tree: MenuBuilderTree,
  categoryId: string,
  field: MenuTranslationField
): LocalizedTextValue {
  const section = findSection(tree, categoryId);
  if (section) {
    return field === "name" ? section.name : section.description ?? "";
  }

  const category = findCategory(tree, categoryId);
  if (!category) return "";
  return field === "name" ? category.name : category.description ?? "";
}

function getDishFieldValue(
  tree: MenuBuilderTree,
  dishId: string,
  field: MenuTranslationField
): LocalizedTextValue {
  for (const section of tree.sections) {
    for (const category of section.categories) {
      const dish = category.dishes.find((entry) => entry.id === dishId);
      if (dish) return field === "name" ? dish.name : dish.description;
    }
  }

  for (const category of tree.orphanCategories) {
    const dish = category.dishes.find((entry) => entry.id === dishId);
    if (dish) return field === "name" ? dish.name : dish.description;
  }

  return "";
}

interface TranslationApiResult {
  translations: string[];
  detectedSourceLanguages: string[];
}

async function callTranslateApi(
  texts: string[],
  targetLang: MenuContentLanguage
): Promise<TranslationApiResult> {
  const response = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      texts,
      source_lang: "auto",
      target_lang: getMenuContentLanguageMeta(targetLang).deeplCode,
      tag_handling: "html",
    }),
  });

  const payload = (await response.json()) as {
    translations?: string[];
    detected_source_languages?: string[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? "Translation failed.");
  }

  if (!payload.translations || payload.translations.length !== texts.length) {
    throw new Error("Translation response was incomplete.");
  }

  return {
    translations: payload.translations,
    detectedSourceLanguages: payload.detected_source_languages ?? [],
  };
}

export async function translateMenuTreeToLanguage(
  tree: MenuBuilderTree,
  targetLang: MenuContentLanguage,
  brandProtection: TranslationBrandProtectionOptions = {}
): Promise<MenuBuilderTree> {
  const items = collectMenuTranslationItems(tree, targetLang);
  if (items.length === 0) return tree;

  const protectedTexts = items.map((item) =>
    applyTranslationBrandProtection(item.text, brandProtection)
  );

  const { translations, detectedSourceLanguages } = await callTranslateApi(
    protectedTexts,
    targetLang
  );

  const categoryPatches = new Map<
    string,
    { name?: LocalizedTextRecord; description?: LocalizedTextRecord }
  >();
  const dishPatches = new Map<
    string,
    { name?: LocalizedTextRecord; description?: LocalizedTextRecord }
  >();

  items.forEach((item, index) => {
    const translated = stripTranslationBrandProtection(translations[index]?.trim() ?? "");
    const detectedBase = deeplCodeToMenuLanguage(detectedSourceLanguages[index]);
    const sourceText = item.text.trim();

    const applyCategoryPatch = (merged: LocalizedTextRecord) => {
      const patch = categoryPatches.get(item.entityId) ?? {};
      patch[item.field] = merged;
      categoryPatches.set(item.entityId, patch);
    };

    const applyDishPatch = (merged: LocalizedTextRecord) => {
      const patch = dishPatches.get(item.entityId) ?? {};
      patch[item.field] = merged;
      dishPatches.set(item.entityId, patch);
    };

    if (item.entityType === "category") {
      const current = getCategoryFieldValue(tree, item.entityId, item.field);

      if (detectedBase === targetLang) {
        if (sourceText) {
          applyCategoryPatch(mergeLocalizedText(current, detectedBase, sourceText, detectedBase));
        }
        return;
      }

      if (!translated) return;

      applyCategoryPatch(mergeLocalizedText(current, targetLang, translated, detectedBase));
      return;
    }

    const current = getDishFieldValue(tree, item.entityId, item.field);

    if (detectedBase === targetLang) {
      if (sourceText) {
        applyDishPatch(mergeLocalizedText(current, detectedBase, sourceText, detectedBase));
      }
      return;
    }

    if (!translated) return;

    applyDishPatch(mergeLocalizedText(current, targetLang, translated, detectedBase));
  });

  await Promise.all([
    ...Array.from(categoryPatches.entries()).map(([id, patch]) =>
      updateMenuCategory(id, patch)
    ),
    ...Array.from(dishPatches.entries()).map(([id, patch]) => {
      const dish = getDishSnapshot(tree, id);
      if (!dish) return Promise.resolve();

      return updateMenuDish(
        id,
        patch.name ?? dish.name,
        patch.description ?? dish.description,
        dish.price,
        dish.image_url,
        dish.tags,
        dish.allergens,
        dish.is_available,
        dish.hide_price
      );
    }),
  ]);

  return applyLocalizedPatchesToTree(tree, categoryPatches, dishPatches);
}

function getDishSnapshot(tree: MenuBuilderTree, dishId: string) {
  for (const section of tree.sections) {
    for (const category of section.categories) {
      const dish = category.dishes.find((entry) => entry.id === dishId);
      if (dish) return dish;
    }
  }

  for (const category of tree.orphanCategories) {
    const dish = category.dishes.find((entry) => entry.id === dishId);
    if (dish) return dish;
  }

  return null;
}

function applyLocalizedPatchesToTree(
  tree: MenuBuilderTree,
  categoryPatches: Map<string, { name?: LocalizedTextRecord; description?: LocalizedTextRecord }>,
  dishPatches: Map<string, { name?: LocalizedTextRecord; description?: LocalizedTextRecord }>
): MenuBuilderTree {
  const patchCategory = <
    T extends { id: string; name: LocalizedTextValue; description: LocalizedTextValue | null },
  >(
    category: T
  ): T => {
    const patch = categoryPatches.get(category.id);
    if (!patch) return category;
    return {
      ...category,
      name: patch.name ?? category.name,
      description: patch.description ?? category.description,
    };
  };

  const patchDish = (dish: MenuBuilderDish): MenuBuilderDish => {
    const patch = dishPatches.get(dish.id);
    if (!patch) return dish;
    return {
      ...dish,
      name: patch.name ?? dish.name,
      description: patch.description ?? dish.description,
    };
  };

  return {
    sections: tree.sections.map((section) => ({
      ...patchCategory(section),
      categories: section.categories.map((category) => ({
        ...patchCategory(category),
        dishes: category.dishes.map(patchDish),
      })),
    })),
    orphanCategories: tree.orphanCategories.map((category) => ({
      ...patchCategory(category),
      dishes: category.dishes.map(patchDish),
    })),
  };
}
