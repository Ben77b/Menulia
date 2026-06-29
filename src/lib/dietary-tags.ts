/** Two-tier tag engine — filterable dietary tags vs informational allergens */

export const FILTERABLE_TAG_OPTIONS = [
  { tag: "Vegan", icon: "🌱", label: "Vegan" },
  { tag: "Vegetarian", icon: "🥬", label: "Vegetarian" },
  { tag: "Spicy", icon: "🌶️", label: "Spicy" },
  { tag: "Gluten-Free", icon: "🌾", label: "Gluten-Free" },
] as const;

export const ALLERGEN_TAG_OPTIONS = [
  { tag: "Nuts", icon: "🥜", label: "Contains nuts" },
  { tag: "Dairy", icon: "🥛", label: "Contains dairy" },
  { tag: "Eggs", icon: "🥚", label: "Contains eggs" },
  { tag: "Soy", icon: "🫘", label: "Contains soy" },
  { tag: "Shellfish", icon: "🦐", label: "Contains shellfish" },
  { tag: "Fish", icon: "🐟", label: "Contains fish" },
  { tag: "Gluten", icon: "🌾", label: "Contains gluten" },
] as const;

export type FilterableTag = (typeof FILTERABLE_TAG_OPTIONS)[number]["tag"];
export type AllergenTag = (typeof ALLERGEN_TAG_OPTIONS)[number]["tag"];

export const FILTERABLE_TAGS: readonly FilterableTag[] = FILTERABLE_TAG_OPTIONS.map((o) => o.tag);
export const ALLERGEN_TAGS: readonly AllergenTag[] = ALLERGEN_TAG_OPTIONS.map((o) => o.tag);

/** Public menu footer / filter bar — filterable tags only */
export const FOOTER_FILTER_TAGS = FILTERABLE_TAG_OPTIONS;

/** @deprecated Use FILTERABLE_TAG_OPTIONS */
export const DIETARY_FILTERS = FILTERABLE_TAG_OPTIONS;

const FILTERABLE_SET = new Set<string>(FILTERABLE_TAGS);
const ALLERGEN_SET = new Set<string>(ALLERGEN_TAGS);

const FILTERABLE_META = Object.fromEntries(
  FILTERABLE_TAG_OPTIONS.map((entry) => [entry.tag, { icon: entry.icon, label: entry.label }])
);

const ALLERGEN_META = Object.fromEntries(
  ALLERGEN_TAG_OPTIONS.map((entry) => [entry.tag, { icon: entry.icon, label: entry.label }])
);

/** @deprecated Use FILTERABLE_TAGS */
export const DIETARY_TAGS = FILTERABLE_TAGS;

/** @deprecated Use FILTERABLE_TAG_OPTIONS */
export const DIETARY_TAG_OPTIONS = FILTERABLE_TAG_OPTIONS;

export function isFilterableTag(tag: string): tag is FilterableTag {
  return FILTERABLE_SET.has(tag);
}

export function isAllergenTag(tag: string): tag is AllergenTag {
  return ALLERGEN_SET.has(tag);
}

export function getFilterableTagMeta(tag: string): { icon: string; label: string } {
  return FILTERABLE_META[tag] ?? { icon: "🏷️", label: tag };
}

export function getAllergenTagMeta(tag: string): { icon: string; label: string } {
  return ALLERGEN_META[tag] ?? { icon: "⚠️", label: tag };
}

export function getTagMeta(tag: string): { icon: string; label: string } {
  if (isFilterableTag(tag)) return getFilterableTagMeta(tag);
  if (isAllergenTag(tag)) return getAllergenTagMeta(tag);
  return { icon: "🏷️", label: tag };
}

/** Split legacy combined `tags` arrays and merge with stored allergens */
export function normalizeDishTagFields(
  rawTags: string[] | null | undefined,
  rawAllergens: string[] | null | undefined = []
): { tags: FilterableTag[]; allergens: AllergenTag[] } {
  const tags = new Set<FilterableTag>();
  const allergens = new Set<AllergenTag>();

  for (const tag of rawAllergens ?? []) {
    if (isAllergenTag(tag)) allergens.add(tag);
  }

  for (const tag of rawTags ?? []) {
    if (isFilterableTag(tag)) {
      tags.add(tag);
    } else if (isAllergenTag(tag)) {
      allergens.add(tag);
    }
  }

  return {
    tags: FILTERABLE_TAGS.filter((tag) => tags.has(tag)),
    allergens: ALLERGEN_TAGS.filter((tag) => allergens.has(tag)),
  };
}

/** Write path: store both tiers in dishes.tags until allergens column is migrated */
export function serializeDishTagsForDb(
  tags: readonly string[],
  allergens: readonly string[]
): string[] {
  const normalized = normalizeDishTagFields([...tags], [...allergens]);
  return [...normalized.tags, ...normalized.allergens];
}

/** Read path: split filterable tags and allergens from DB row */
export function parseDishTagsFromDb(row: {
  tags?: string[] | null;
  allergens?: string[] | null;
}): { tags: FilterableTag[]; allergens: AllergenTag[] } {
  return normalizeDishTagFields(row.tags, row.allergens);
}
