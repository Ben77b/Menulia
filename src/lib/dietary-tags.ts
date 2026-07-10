/** Two-tier tag engine — filterable dietary tags vs EU 14 informational allergens */

export const FILTERABLE_TAG_OPTIONS = [
  { tag: "Vegan", icon: "🌱", label: "Vegan" },
  { tag: "Vegetarian", icon: "🥬", label: "Vegetarian" },
  { tag: "Spicy", icon: "🌶️", label: "Spicy" },
  { tag: "Gluten-Free", icon: "🌾", label: "Gluten-Free" },
] as const;

/** Stable allergen ids (EU Reg. 1169/2011) — stored in dishes.allergens */
export const ALLERGEN_TAG_OPTIONS = [
  {
    tag: "gluten",
    icon: "🌾",
    labels: { en: "Gluten (cereals)", es: "Cereales que contienen gluten" },
  },
  { tag: "crustaceans", icon: "🦐", labels: { en: "Crustaceans", es: "Crustáceos" } },
  { tag: "eggs", icon: "🥚", labels: { en: "Eggs", es: "Huevos" } },
  { tag: "fish", icon: "🐟", labels: { en: "Fish", es: "Pescado" } },
  { tag: "peanuts", icon: "🥜", labels: { en: "Peanuts", es: "Cacahuetes" } },
  { tag: "soybeans", icon: "🫘", labels: { en: "Soybeans", es: "Soja" } },
  {
    tag: "milk",
    icon: "🥛",
    labels: { en: "Milk / dairy", es: "Leche y derivados / Lactosa" },
  },
  {
    tag: "tree_nuts",
    icon: "🌰",
    labels: { en: "Tree nuts", es: "Frutos de cáscara" },
  },
  { tag: "celery", icon: "🥬", labels: { en: "Celery", es: "Apio" } },
  { tag: "mustard", icon: "🟡", labels: { en: "Mustard", es: "Mostaza" } },
  { tag: "sesame", icon: "⚪", labels: { en: "Sesame", es: "Granos de sésamo" } },
  {
    tag: "sulphites",
    icon: "🍷",
    labels: { en: "Sulphur dioxide / sulphites", es: "Dióxido de azufre y sulfitos" },
  },
  { tag: "lupin", icon: "🌼", labels: { en: "Lupin", es: "Altramuces" } },
  { tag: "molluscs", icon: "🦑", labels: { en: "Molluscs", es: "Moluscos" } },
] as const;

export type FilterableTag = (typeof FILTERABLE_TAG_OPTIONS)[number]["tag"];
export type AllergenTag = (typeof ALLERGEN_TAG_OPTIONS)[number]["tag"];

export type AllergenLocale = "en" | "es";

export const FILTERABLE_TAGS: readonly FilterableTag[] = FILTERABLE_TAG_OPTIONS.map((o) => o.tag);
export const ALLERGEN_TAGS: readonly AllergenTag[] = ALLERGEN_TAG_OPTIONS.map((o) => o.tag);

/** Public menu footer / filter bar — filterable tags only */
export const FOOTER_FILTER_TAGS = FILTERABLE_TAG_OPTIONS;

/** @deprecated Use FILTERABLE_TAG_OPTIONS */
export const DIETARY_FILTERS = FILTERABLE_TAG_OPTIONS;

/** Maps legacy allergen chip values to EU ids */
const LEGACY_ALLERGEN_MAP: Record<string, AllergenTag> = {
  Gluten: "gluten",
  Nuts: "tree_nuts",
  Dairy: "milk",
  Eggs: "eggs",
  Soy: "soybeans",
  Shellfish: "crustaceans",
  Fish: "fish",
};

const FILTERABLE_SET = new Set<string>(FILTERABLE_TAGS);
const ALLERGEN_SET = new Set<string>(ALLERGEN_TAGS);

const FILTERABLE_META = Object.fromEntries(
  FILTERABLE_TAG_OPTIONS.map((entry) => [entry.tag, { icon: entry.icon, label: entry.label }])
);

const ALLERGEN_META = Object.fromEntries(
  ALLERGEN_TAG_OPTIONS.map((entry) => [
    entry.tag,
    { icon: entry.icon, labels: entry.labels },
  ])
);

/** @deprecated Use FILTERABLE_TAGS */
export const DIETARY_TAGS = FILTERABLE_TAGS;

/** @deprecated Use FILTERABLE_TAG_OPTIONS */
export const DIETARY_TAG_OPTIONS = FILTERABLE_TAG_OPTIONS;

export function normalizeAllergenId(value: string): AllergenTag | null {
  if (ALLERGEN_SET.has(value)) return value as AllergenTag;
  const legacy = LEGACY_ALLERGEN_MAP[value];
  if (legacy) return legacy;
  return null;
}

export function isFilterableTag(tag: string): tag is FilterableTag {
  return FILTERABLE_SET.has(tag);
}

export function isAllergenTag(tag: string): tag is AllergenTag {
  return normalizeAllergenId(tag) !== null;
}

export function getFilterableTagMeta(tag: string): { icon: string; label: string } {
  return FILTERABLE_META[tag] ?? { icon: "🏷️", label: tag };
}

export function getAllergenLabel(tag: string, locale: AllergenLocale = "en"): string {
  const id = normalizeAllergenId(tag);
  if (!id) return tag;
  return ALLERGEN_META[id]?.labels[locale] ?? tag;
}

/** Dashboard editor — Spanish-first labels for Spain launch */
export function getAllergenEditorLabel(tag: AllergenTag): string {
  return ALLERGEN_META[tag]?.labels.es ?? tag;
}

export function getAllergenTagMeta(
  tag: string,
  locale: AllergenLocale = "en"
): { icon: string; label: string } {
  const id = normalizeAllergenId(tag);
  if (!id) return { icon: "⚠️", label: tag };
  const meta = ALLERGEN_META[id];
  return { icon: meta.icon, label: meta.labels[locale] };
}

export function getTagMeta(tag: string, locale: AllergenLocale = "en"): { icon: string; label: string } {
  if (isFilterableTag(tag)) return getFilterableTagMeta(tag);
  if (isAllergenTag(tag)) return getAllergenTagMeta(tag, locale);
  return { icon: "🏷️", label: tag };
}

/** Split legacy combined `tags` arrays and merge with stored allergens */
export function normalizeDishTagFields(
  rawTags: string[] | null | undefined,
  rawAllergens: string[] | null | undefined = []
): { tags: FilterableTag[]; allergens: AllergenTag[] } {
  const tags = new Set<FilterableTag>();
  const allergens = new Set<AllergenTag>();

  for (const value of rawAllergens ?? []) {
    const id = normalizeAllergenId(value);
    if (id) allergens.add(id);
  }

  for (const value of rawTags ?? []) {
    if (isFilterableTag(value)) {
      tags.add(value);
      continue;
    }
    const id = normalizeAllergenId(value);
    if (id) allergens.add(id);
  }

  return {
    tags: FILTERABLE_TAGS.filter((tag) => tags.has(tag)),
    allergens: ALLERGEN_TAGS.filter((tag) => allergens.has(tag)),
  };
}

/** Write path: filterable tags only (dishes.tags) */
export function serializeDishTagsForDb(
  tags: readonly string[],
  allergens: readonly string[] = []
): FilterableTag[] {
  return normalizeDishTagFields([...tags], [...allergens]).tags;
}

/** Write path: EU allergen ids (dishes.allergens) */
export function serializeAllergensForDb(
  allergens: readonly string[],
  tags: readonly string[] = []
): AllergenTag[] {
  return normalizeDishTagFields([...tags], [...allergens]).allergens;
}

/** Read path: split filterable tags and allergens from DB row */
export function parseDishTagsFromDb(row: {
  tags?: string[] | null;
  allergens?: string[] | null;
}): { tags: FilterableTag[]; allergens: AllergenTag[] } {
  return normalizeDishTagFields(row.tags, row.allergens);
}

/** Icon map for legacy components — includes EU ids and legacy chip values */
export const ALLERGEN_ICONS: Record<string, string> = {
  ...Object.fromEntries(ALLERGEN_TAG_OPTIONS.map((entry) => [entry.tag, entry.icon])),
  Gluten: "🌾",
  Nuts: "🌰",
  Dairy: "🥛",
  Eggs: "🥚",
  Shellfish: "🦐",
  Soy: "🫘",
  Fish: "🐟",
};
