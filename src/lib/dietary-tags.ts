/** Two-tier tag engine — filterable dietary tags vs EU 14 informational allergens */

export const FILTERABLE_TAG_OPTIONS = [
  { tag: "Vegan", icon: "🌱", label: "Vegan" },
  { tag: "Vegetarian", icon: "🥬", label: "Vegetarian" },
  { tag: "Gluten-Free", icon: "🌾", label: "Gluten-Free" },
] as const;

/** Max unique tags per restaurant library (defaults + custom) */
export const MAX_RESTAURANT_TAGS = 10;

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
    labels: { en: "Milk and dairy", es: "Leche y derivados" },
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
    labels: { en: "Sulphur dioxide and sulphites", es: "Dióxido de azufre y sulfitos" },
  },
  { tag: "lupin", icon: "🌼", labels: { en: "Lupin", es: "Altramuces" } },
  { tag: "molluscs", icon: "🦑", labels: { en: "Molluscs", es: "Moluscos" } },
] as const;

export type FilterableTag = (typeof FILTERABLE_TAG_OPTIONS)[number]["tag"];
export type AllergenTag = (typeof ALLERGEN_TAG_OPTIONS)[number]["tag"];

export type AllergenLocale = "en" | "es";

export const FILTERABLE_TAGS: readonly FilterableTag[] = FILTERABLE_TAG_OPTIONS.map((o) => o.tag);
export const ALLERGEN_TAGS: readonly AllergenTag[] = ALLERGEN_TAG_OPTIONS.map((o) => o.tag);

export interface DishTagAppearance {
  /** Canonical display / filter identity */
  label: string;
  icon: string;
  /** Value stored in dishes.tags (plain label or emoji|label) */
  encoded: string;
}

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

/** Legacy color-aware format: emoji|label|#HEX — color segment is ignored */
const ENCODED_TAG_WITH_COLOR_RE = /^(.*)\|([^|]+)\|(#[0-9A-Fa-f]{6})$/u;
/** Current format: emoji|label */
const ENCODED_TAG_RE = /^(.*)\|([^|]+)$/u;

/** @deprecated Use FILTERABLE_TAGS */
export const DIETARY_TAGS = FILTERABLE_TAGS;

/** @deprecated Use FILTERABLE_TAG_OPTIONS */
export const DIETARY_TAG_OPTIONS = FILTERABLE_TAG_OPTIONS;

/** Trim / collapse whitespace and cap length for free-form tags */
export function normalizeTagLabel(value: string): string {
  return value.trim().replace(/\s+/g, " ").replace(/\|/g, "").slice(0, 40);
}

export function encodeDishTag(label: string, icon?: string | null): string {
  const cleanLabel = normalizeTagLabel(label);
  if (!cleanLabel) return "";

  const canonicalDefault = FILTERABLE_TAGS.find(
    (tag) => tag.toLowerCase() === cleanLabel.toLowerCase()
  );
  const resolvedLabel = canonicalDefault ?? cleanLabel;
  const defaultIcon = canonicalDefault
    ? FILTERABLE_META[canonicalDefault]?.icon ?? "🏷️"
    : "🏷️";

  const cleanIcon = (icon ?? "").trim() || defaultIcon;

  if (canonicalDefault && cleanIcon === defaultIcon) {
    return resolvedLabel;
  }

  return `${cleanIcon}|${resolvedLabel}`;
}

/** Parse plain tags, `emoji|label`, or legacy `emoji|label|#HEX` (color ignored). */
export function parseDishTag(raw: string | null | undefined): DishTagAppearance {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    return {
      label: "",
      icon: "🏷️",
      encoded: "",
    };
  }

  const withColorMatch = trimmed.match(ENCODED_TAG_WITH_COLOR_RE);
  if (withColorMatch) {
    const icon = withColorMatch[1]!.trim() || "🏷️";
    const label = normalizeTagLabel(withColorMatch[2]!);
    const canonicalDefault = FILTERABLE_TAGS.find(
      (tag) => tag.toLowerCase() === label.toLowerCase()
    );
    const resolvedLabel = canonicalDefault ?? label;
    const resolvedIcon = canonicalDefault
      ? FILTERABLE_META[canonicalDefault]?.icon ?? icon
      : icon;
    return {
      label: resolvedLabel,
      icon: resolvedIcon,
      encoded: encodeDishTag(resolvedLabel, resolvedIcon),
    };
  }

  const encodedMatch = trimmed.match(ENCODED_TAG_RE);
  if (encodedMatch) {
    const icon = encodedMatch[1]!.trim() || "🏷️";
    const label = normalizeTagLabel(encodedMatch[2]!);
    const canonicalDefault = FILTERABLE_TAGS.find(
      (tag) => tag.toLowerCase() === label.toLowerCase()
    );
    const resolvedLabel = canonicalDefault ?? label;
    const resolvedIcon = canonicalDefault
      ? FILTERABLE_META[canonicalDefault]?.icon ?? icon
      : icon;
    return {
      label: resolvedLabel,
      icon: resolvedIcon,
      encoded: encodeDishTag(resolvedLabel, resolvedIcon),
    };
  }

  const label = normalizeTagLabel(trimmed);
  const canonicalDefault = FILTERABLE_TAGS.find(
    (tag) => tag.toLowerCase() === label.toLowerCase()
  );
  if (canonicalDefault) {
    return {
      label: canonicalDefault,
      icon: FILTERABLE_META[canonicalDefault]?.icon ?? "🏷️",
      encoded: canonicalDefault,
    };
  }

  return {
    label,
    icon: "🏷️",
    encoded: label,
  };
}

export function dishTagLabel(raw: string): string {
  return parseDishTag(raw).label;
}

export function normalizeAllergenId(value: string): AllergenTag | null {
  const label = parseDishTag(value).label || value.trim();
  if (ALLERGEN_SET.has(label)) return label as AllergenTag;
  if (ALLERGEN_SET.has(value.trim())) return value.trim() as AllergenTag;
  const legacy = LEGACY_ALLERGEN_MAP[value.trim()] ?? LEGACY_ALLERGEN_MAP[label];
  if (legacy) return legacy;
  return null;
}

export function isFilterableTag(tag: string): tag is FilterableTag {
  const label = parseDishTag(tag).label;
  return FILTERABLE_SET.has(label);
}

export function isAllergenTag(tag: string): tag is AllergenTag {
  return normalizeAllergenId(tag) !== null;
}

export function getFilterableTagMeta(tag: string): { icon: string; label: string } {
  const parsed = parseDishTag(tag);
  if (FILTERABLE_META[parsed.label]) {
    return {
      icon: FILTERABLE_META[parsed.label].icon,
      label: FILTERABLE_META[parsed.label].label,
    };
  }
  return { icon: parsed.icon, label: parsed.label };
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

export function getTagMeta(
  tag: string,
  locale: AllergenLocale = "en"
): { icon: string; label: string } {
  if (isAllergenTag(tag) && !parseDishTag(tag).encoded.includes("|")) {
    return getAllergenTagMeta(tag, locale);
  }
  const parsed = parseDishTag(tag);
  return { icon: parsed.icon, label: parsed.label };
}

/** Build unique styled filter chips from dish tag payloads only (no unused defaults). */
export function collectPresentTagAppearances(
  rawTags: Iterable<string>
): DishTagAppearance[] {
  const byLabel = new Map<string, DishTagAppearance>();

  for (const raw of rawTags) {
    const parsed = parseDishTag(raw);
    if (!parsed.label) continue;
    if (normalizeAllergenId(parsed.label)) continue;
    byLabel.set(parsed.label.toLowerCase(), parsed);
  }

  return Array.from(byLabel.values());
}

/** Count restaurant tag library size: defaults always reserved + unique custom tags. */
export function countRestaurantTagLibrary(rawTags: Iterable<string>): {
  total: number;
  customCount: number;
  max: number;
  atLimit: boolean;
} {
  const present = collectPresentTagAppearances(rawTags);
  const customCount = present.filter((tag) => !isFilterableTag(tag.label)).length;
  const total = FILTERABLE_TAGS.length + customCount;
  return {
    total,
    customCount,
    max: MAX_RESTAURANT_TAGS,
    atLimit: total >= MAX_RESTAURANT_TAGS,
  };
}

/** Build unique styled filter chips from dish tag payloads + default dietary options */
export function collectMenuTagAppearances(
  rawTags: Iterable<string>
): DishTagAppearance[] {
  const byLabel = new Map<string, DishTagAppearance>();

  for (const option of FILTERABLE_TAG_OPTIONS) {
    byLabel.set(option.tag.toLowerCase(), parseDishTag(option.tag));
  }

  for (const appearance of collectPresentTagAppearances(rawTags)) {
    byLabel.set(appearance.label.toLowerCase(), appearance);
  }

  return Array.from(byLabel.values());
}

/** Split legacy combined `tags` arrays and merge with stored allergens.
 * Preserves custom free-form tags and encoded emoji metadata. */
export function normalizeDishTagFields(
  rawTags: string[] | null | undefined,
  rawAllergens: string[] | null | undefined = []
): { tags: string[]; allergens: AllergenTag[] } {
  const tags: string[] = [];
  const allergens = new Set<AllergenTag>();
  const seenTags = new Set<string>();

  for (const value of rawAllergens ?? []) {
    const id = normalizeAllergenId(value);
    if (id) allergens.add(id);
  }

  for (const value of rawTags ?? []) {
    const parsed = parseDishTag(value);
    if (!parsed.label) continue;

    const allergenId = normalizeAllergenId(parsed.label);
    if (allergenId && !value.includes("|")) {
      allergens.add(allergenId);
      continue;
    }

    const key = parsed.label.toLowerCase();
    if (seenTags.has(key)) continue;
    seenTags.add(key);
    tags.push(parsed.encoded);
  }

  return {
    tags,
    allergens: ALLERGEN_TAGS.filter((tag) => allergens.has(tag)),
  };
}

/** Write path: filterable + custom tags (dishes.tags); allergens never stored here */
export function serializeDishTagsForDb(
  tags: readonly string[],
  allergens: readonly string[] = []
): string[] {
  return normalizeDishTagFields([...tags], [...allergens]).tags;
}

/** Write path: EU allergen ids (dishes.allergens) */
export function serializeAllergensForDb(
  allergens: readonly string[],
  tags: readonly string[] = []
): AllergenTag[] {
  return normalizeDishTagFields([...tags], [...allergens]).allergens;
}

/** Read path: split filterable/custom tags and allergens from DB row */
export function parseDishTagsFromDb(row: {
  tags?: string[] | null;
  allergens?: string[] | null;
}): { tags: string[]; allergens: AllergenTag[] } {
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
