import { normalizeCategoryLayoutType } from "./category-layout";
import type { MenuCategoryRecord } from "./menu-db";
import type { MenuBuilderCategory, MenuBuilderSection, MenuBuilderTree } from "./menu-builder-types";

export function flatRecordsToMenuTree(records: MenuCategoryRecord[]): MenuBuilderTree {
  const sorted = [...records].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  const sections: MenuBuilderSection[] = sorted
    .filter((row) => !row.parent_id)
    .map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? null,
      order_index: row.order_index ?? 0,
      categories: [],
    }));

  const sectionById = new Map(sections.map((section) => [section.id, section]));
  const orphanCategories: MenuBuilderCategory[] = [];

  for (const row of sorted) {
    if (!row.parent_id) continue;

    const category: MenuBuilderCategory = {
      id: row.id,
      name: row.name,
      description: row.description ?? null,
      layout_type: normalizeCategoryLayoutType(row.layout_type),
      order_index: row.order_index ?? 0,
      parent_id: row.parent_id,
      lock_title_translation: Boolean(row.lock_title_translation),
      dishes: [...(row.items ?? [])].sort(
        (a, b) => (a?.display_order ?? 0) - (b?.display_order ?? 0)
      ),
    };

    const parent = sectionById.get(row.parent_id);
    if (parent) {
      parent.categories.push(category);
    } else {
      orphanCategories.push(category);
    }
  }

  for (const section of sections) {
    section.categories.sort((a, b) => a.order_index - b.order_index);
  }

  orphanCategories.sort((a, b) => a.order_index - b.order_index);

  return { sections, orphanCategories };
}

export function countTreeDishes(tree: MenuBuilderTree): number {
  let count = 0;
  for (const section of tree.sections) {
    for (const category of section.categories) {
      count += category.dishes.length;
    }
  }
  for (const category of tree.orphanCategories) {
    count += category.dishes.length;
  }
  return count;
}

export function countSectionContents(section: MenuBuilderSection): {
  categories: number;
  dishes: number;
} {
  const categories = section.categories?.length ?? 0;
  const dishes = (section.categories ?? []).reduce(
    (sum, cat) => sum + (cat?.dishes?.length ?? 0),
    0
  );
  return { categories, dishes };
}
