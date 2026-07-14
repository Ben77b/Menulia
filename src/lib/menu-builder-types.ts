import type { MenuDishRecord } from "./menu-db";
import type { LocalizedTextValue } from "./localized-text";
import type { CategoryLayoutType } from "./category-layout";

/** Tier 3 — leaf item on the public menu */
export type MenuBuilderDish = MenuDishRecord;

/** Tier 2 — nested under a section; holds dishes */
export interface MenuBuilderCategory {
  id: string;
  name: LocalizedTextValue;
  description: LocalizedTextValue | null;
  layout_type: CategoryLayoutType;
  order_index: number;
  parent_id: string;
  dishes: MenuBuilderDish[];
}

/** Tier 1 — top-level section (Food, Drinks, …) */
export interface MenuBuilderSection {
  id: string;
  name: LocalizedTextValue;
  description: LocalizedTextValue | null;
  order_index: number;
  categories: MenuBuilderCategory[];
}

export interface MenuBuilderTree {
  sections: MenuBuilderSection[];
  /** Flat categories with no parent — shown as single-tier fallback */
  orphanCategories: MenuBuilderCategory[];
}
