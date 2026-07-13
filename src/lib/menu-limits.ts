export const MAX_CATEGORIES_PER_SECTION = 20;
export const MAX_SECTIONS = 20;
export const MAX_CUSTOM_LINKS = 8;
export const MAX_LINK_LABEL_LENGTH = 40;

/** Section titles (top-level menu groups). */
export const MAX_SECTION_TITLE = 60;
/** Category names (nested under sections). */
export const MAX_CATEGORY_NAME = 60;
/** Dish names on the public menu. */
export const MAX_DISH_NAME = 100;
/** Dish descriptions on the public menu. */
export const MAX_DISH_DESCRIPTION = 600;

export function clampMenuText(value: string, max: number): string {
  return value.trim().slice(0, max);
}
