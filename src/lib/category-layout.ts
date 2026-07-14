export type CategoryLayoutType = "carousel" | "stacked" | "stacked_left";

export const CATEGORY_LAYOUT_OPTIONS: Array<{
  value: CategoryLayoutType;
  labelKey: string;
}> = [
  { value: "carousel", labelKey: "builder.layout.carousel" },
  { value: "stacked", labelKey: "builder.layout.stacked" },
  { value: "stacked_left", labelKey: "builder.layout.stackedLeft" },
];

export function normalizeCategoryLayoutType(value: unknown): CategoryLayoutType {
  if (value === "carousel") return "carousel";
  if (value === "stacked_left" || value === "stacked-left") return "stacked_left";
  if (value === "stacked_right" || value === "stacked-right") return "stacked_left";
  return "stacked";
}

export function isCarouselCategoryLayout(layout: CategoryLayoutType): boolean {
  return layout === "carousel";
}

export function isStackedCategoryLayout(layout: CategoryLayoutType): boolean {
  return layout === "stacked" || layout === "stacked_left";
}

export function isStackedTopCategoryLayout(layout: CategoryLayoutType): boolean {
  return layout === "stacked";
}

export function isStackedLeftCategoryLayout(layout: CategoryLayoutType): boolean {
  return layout === "stacked_left";
}
