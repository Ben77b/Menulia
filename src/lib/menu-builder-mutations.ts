import type {
  MenuBuilderCategory,
  MenuBuilderDish,
  MenuBuilderSection,
  MenuBuilderTree,
} from "./menu-builder-types";

export function renameCategoryInTree(tree: MenuBuilderTree, id: string, name: string): MenuBuilderTree {
  return {
    sections: tree.sections.map((section) =>
      section.id === id
        ? { ...section, name }
        : {
            ...section,
            categories: section.categories.map((category) =>
              category.id === id ? { ...category, name } : category
            ),
          }
    ),
    orphanCategories: tree.orphanCategories.map((category) =>
      category.id === id ? { ...category, name } : category
    ),
  };
}

export function patchCategoryInTree(
  tree: MenuBuilderTree,
  categoryId: string,
  patch: Partial<MenuBuilderCategory>
): MenuBuilderTree {
  return {
    sections: tree.sections.map((section) => ({
      ...section,
      categories: section.categories.map((category) =>
        category.id === categoryId ? { ...category, ...patch } : category
      ),
    })),
    orphanCategories: tree.orphanCategories.map((category) =>
      category.id === categoryId ? { ...category, ...patch } : category
    ),
  };
}

export function addSectionToTree(tree: MenuBuilderTree, section: MenuBuilderSection): MenuBuilderTree {
  return {
    ...tree,
    sections: [...tree.sections, section].sort((a, b) => a.order_index - b.order_index),
  };
}

export function removeSectionFromTree(tree: MenuBuilderTree, sectionId: string): MenuBuilderTree {
  return {
    ...tree,
    sections: tree.sections.filter((section) => section.id !== sectionId),
  };
}

export function addCategoryToSection(
  tree: MenuBuilderTree,
  sectionId: string,
  category: MenuBuilderCategory
): MenuBuilderTree {
  return {
    ...tree,
    sections: tree.sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            categories: [...section.categories, category].sort((a, b) => a.order_index - b.order_index),
          }
        : section
    ),
  };
}

export function removeCategoryFromSection(
  tree: MenuBuilderTree,
  sectionId: string,
  categoryId: string
): MenuBuilderTree {
  return {
    ...tree,
    sections: tree.sections.map((section) =>
      section.id === sectionId
        ? { ...section, categories: section.categories.filter((category) => category.id !== categoryId) }
        : section
    ),
  };
}

export function addCategoryToTree(tree: MenuBuilderTree, category: MenuBuilderCategory): MenuBuilderTree {
  if (category.parent_id) {
    return addCategoryToSection(tree, category.parent_id, category);
  }
  return {
    ...tree,
    orphanCategories: [...tree.orphanCategories, category].sort((a, b) => a.order_index - b.order_index),
  };
}

export function duplicateCategoryInSection(
  tree: MenuBuilderTree,
  sectionId: string,
  category: MenuBuilderCategory
): MenuBuilderTree {
  return addCategoryToSection(tree, sectionId, category);
}

export function reorderSectionsInTree(
  tree: MenuBuilderTree,
  orderedIds: string[]
): MenuBuilderTree {
  const byId = new Map(tree.sections.map((section) => [section.id, section]));
  const reordered = orderedIds
    .map((id, index) => {
      const section = byId.get(id);
      return section ? { ...section, order_index: index } : null;
    })
    .filter((section): section is MenuBuilderSection => section !== null);

  return { ...tree, sections: reordered };
}

export function reorderCategoriesInSection(
  tree: MenuBuilderTree,
  sectionId: string,
  orderedIds: string[]
): MenuBuilderTree {
  return {
    ...tree,
    sections: tree.sections.map((section) => {
      if (section.id !== sectionId) return section;

      const byId = new Map(section.categories.map((category) => [category.id, category]));
      const reordered = orderedIds
        .map((id, index) => {
          const category = byId.get(id);
          return category ? { ...category, order_index: index } : null;
        })
        .filter((category): category is MenuBuilderCategory => category !== null);

      return { ...section, categories: reordered };
    }),
  };
}

export function addDishToCategory(
  tree: MenuBuilderTree,
  categoryId: string,
  dish: MenuBuilderDish
): MenuBuilderTree {
  return patchCategoryInTree(tree, categoryId, {
    dishes: [
      ...(findCategory(tree, categoryId)?.dishes ?? []),
      dish,
    ].sort((a, b) => a.display_order - b.display_order),
  });
}

export function updateDishInCategory(
  tree: MenuBuilderTree,
  categoryId: string,
  dishId: string,
  patch: Partial<MenuBuilderDish>
): MenuBuilderTree {
  const category = findCategory(tree, categoryId);
  if (!category) return tree;

  return patchCategoryInTree(tree, categoryId, {
    dishes: category.dishes.map((dish) => (dish.id === dishId ? { ...dish, ...patch } : dish)),
  });
}

export function removeDishFromCategory(
  tree: MenuBuilderTree,
  categoryId: string,
  dishId: string
): MenuBuilderTree {
  const category = findCategory(tree, categoryId);
  if (!category) return tree;

  return patchCategoryInTree(tree, categoryId, {
    dishes: category.dishes.filter((dish) => dish.id !== dishId),
  });
}

export function reorderDishesInCategory(
  tree: MenuBuilderTree,
  categoryId: string,
  orderedIds: string[]
): MenuBuilderTree {
  const category = findCategory(tree, categoryId);
  if (!category) return tree;

  const byId = new Map(category.dishes.map((dish) => [dish.id, dish]));
  const reordered = orderedIds
    .map((id, index) => {
      const dish = byId.get(id);
      return dish ? { ...dish, display_order: index } : null;
    })
    .filter((dish): dish is MenuBuilderDish => dish !== null);

  return patchCategoryInTree(tree, categoryId, { dishes: reordered });
}

export function findCategory(
  tree: MenuBuilderTree,
  categoryId: string
): MenuBuilderCategory | undefined {
  for (const section of tree.sections) {
    const match = section.categories.find((category) => category.id === categoryId);
    if (match) return match;
  }
  return tree.orphanCategories.find((category) => category.id === categoryId);
}

export function recordsToCategory(category: {
  id: string;
  name: string;
  description: string | null;
  layout_type: string;
  order_index: number;
  parent_id: string | null;
  items: MenuBuilderDish[];
}): MenuBuilderCategory {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    layout_type: category.layout_type === "carousel" ? "carousel" : "stacked",
    order_index: category.order_index,
    parent_id: category.parent_id ?? "",
    dishes: [...category.items].sort((a, b) => a.display_order - b.display_order),
  };
}

export function recordsToSection(category: {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
}): MenuBuilderSection {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    order_index: category.order_index,
    categories: [],
  };
}
