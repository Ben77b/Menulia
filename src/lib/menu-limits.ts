export const MAX_CATEGORIES_PER_SECTION = 20;
export const MAX_SECTIONS = 20;
export const MAX_CATEGORY_NAME_LENGTH = 24;
export const MAX_CUSTOM_LINKS = 8;
export const MAX_LINK_LABEL_LENGTH = 40;

export function truncateCategoryName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= MAX_CATEGORY_NAME_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_CATEGORY_NAME_LENGTH - 1)}…`;
}
