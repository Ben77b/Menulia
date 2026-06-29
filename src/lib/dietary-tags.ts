/** Canonical dietary badge / filter tags — single source for builder UI and public footer legend */

export const DIETARY_TAG_OPTIONS = [
  { tag: "Vegan", icon: "🌱", label: "Vegan" },
  { tag: "Vegetarian", icon: "🥬", label: "Vegetarian" },
  { tag: "Gluten-Free", icon: "🌾", label: "Gluten-Free" },
  { tag: "Dairy-Free", icon: "🥛", label: "Dairy-Free" },
  { tag: "Nut-Free", icon: "🥜", label: "Nut-Free" },
  { tag: "Spicy", icon: "🌶️", label: "Spicy" },
] as const;

export const ALLERGEN_TAG_OPTIONS = [
  { tag: "Nuts", icon: "🥜", label: "Contains nuts" },
  { tag: "Dairy", icon: "🥛", label: "Contains dairy" },
  { tag: "Gluten", icon: "🌾", label: "Contains gluten" },
  { tag: "Eggs", icon: "🥚", label: "Contains eggs" },
  { tag: "Shellfish", icon: "🦐", label: "Contains shellfish" },
  { tag: "Soy", icon: "🫘", label: "Contains soy" },
  { tag: "Fish", icon: "🐟", label: "Contains fish" },
] as const;

export type DietaryTag = (typeof DIETARY_TAG_OPTIONS)[number]["tag"];
export type AllergenTag = (typeof ALLERGEN_TAG_OPTIONS)[number]["tag"];
export type MenuTag = DietaryTag | AllergenTag;

/** Tag strings for dish builder pickers */
export const DIETARY_TAGS: readonly DietaryTag[] = DIETARY_TAG_OPTIONS.map((o) => o.tag);
export const ALLERGEN_TAGS: readonly AllergenTag[] = ALLERGEN_TAG_OPTIONS.map((o) => o.tag);

/** Legacy aliases used by filter bar */
export const DIETARY_FILTERS = DIETARY_TAG_OPTIONS;
export const ALLERGEN_FILTERS = ALLERGEN_TAG_OPTIONS;

export const FOOTER_FILTER_TAGS = [...DIETARY_TAG_OPTIONS, ...ALLERGEN_TAG_OPTIONS];

export const DIETARY_ICONS: Record<string, { icon: string; label: string }> = Object.fromEntries(
  FOOTER_FILTER_TAGS.map((entry) => [entry.tag, { icon: entry.icon, label: entry.label }])
);

export function getTagMeta(tag: string): { icon: string; label: string } {
  return DIETARY_ICONS[tag] ?? { icon: "🏷️", label: tag };
}
