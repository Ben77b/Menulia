export type CategoryLayoutType = "carousel" | "stacked" | "stacked_right";

export const CATEGORY_LAYOUT_OPTIONS: Array<{
  value: CategoryLayoutType;
  labelKey: string;
}> = [
  { value: "carousel", labelKey: "builder.layout.carousel" },
  { value: "stacked", labelKey: "builder.layout.stackedLeft" },
  { value: "stacked_right", labelKey: "builder.layout.stackedRight" },
];

export function normalizeCategoryLayoutType(value: unknown): CategoryLayoutType {
  if (value === "carousel") return "carousel";
  if (value === "stacked_right" || value === "stacked-right") return "stacked_right";
  if (value === "stacked_left" || value === "stacked-left") return "stacked";
  return "stacked";
}

export function isCarouselCategoryLayout(layout: CategoryLayoutType): boolean {
  return layout === "carousel";
}

export function isStackedCategoryLayout(layout: CategoryLayoutType): boolean {
  return layout === "stacked" || layout === "stacked_right";
}
