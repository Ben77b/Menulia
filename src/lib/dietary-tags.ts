export const DIETARY_FILTERS = [
  { tag: "Vegan", icon: "🌱", label: "Vegan" },
  { tag: "Vegetarian", icon: "🥬", label: "Vegetarian" },
  { tag: "Gluten-Free", icon: "🌾", label: "Gluten-Free" },
] as const;

export type DietaryTag = (typeof DIETARY_FILTERS)[number]["tag"];
