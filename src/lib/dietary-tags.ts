export const DIETARY_FILTERS = [
  { tag: "Vegan", icon: "🌱", label: "Vegan" },
  { tag: "Vegetarian", icon: "🥬", label: "Vegetarian" },
  { tag: "Gluten-Free", icon: "🌾", label: "Gluten-Free" },
] as const;

export const ALLERGEN_FILTERS = [
  { tag: "Nuts", icon: "🥜", label: "Contains nuts" },
  { tag: "Dairy", icon: "🥛", label: "Contains dairy" },
  { tag: "Eggs", icon: "🥚", label: "Contains eggs" },
  { tag: "Shellfish", icon: "🦐", label: "Contains shellfish" },
  { tag: "Soy", icon: "🫘", label: "Contains soy" },
  { tag: "Fish", icon: "🐟", label: "Contains fish" },
  { tag: "Gluten", icon: "🌾", label: "Contains gluten" },
] as const;

export type DietaryTag = (typeof DIETARY_FILTERS)[number]["tag"];

export const FOOTER_FILTER_TAGS = [...DIETARY_FILTERS, ...ALLERGEN_FILTERS];

export const DIETARY_ICONS: Record<string, { icon: string; label: string }> = {
  Vegan: { icon: "🌱", label: "Vegan" },
  Vegetarian: { icon: "🥬", label: "Vegetarian" },
  "Gluten-Free": { icon: "🌾", label: "Gluten-Free" },
  Nuts: { icon: "🥜", label: "Nuts" },
  Dairy: { icon: "🥛", label: "Dairy" },
  Eggs: { icon: "🥚", label: "Eggs" },
  Shellfish: { icon: "🦐", label: "Shellfish" },
  Soy: { icon: "🫘", label: "Soy" },
  Fish: { icon: "🐟", label: "Fish" },
  Gluten: { icon: "🌾", label: "Gluten" },
};

export function getTagMeta(tag: string): { icon: string; label: string } {
  return DIETARY_ICONS[tag] ?? { icon: "🏷️", label: tag };
}
