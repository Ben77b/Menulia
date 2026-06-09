export interface RestaurantDesign {
  accentColor: string;
  backgroundColor: string;
  cardRadius: "rounded" | "sharp" | "pill";
  headerStyle: "minimal" | "bold";
}

export const DEFAULT_DESIGN: RestaurantDesign = {
  accentColor: "#047857",
  backgroundColor: "#fafafa",
  cardRadius: "rounded",
  headerStyle: "minimal",
};

const STORAGE_KEY = "menulia_restaurant_design";

export function loadDesign(restaurantId: string): RestaurantDesign {
  if (typeof window === "undefined") return DEFAULT_DESIGN;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${restaurantId}`);
    return raw ? { ...DEFAULT_DESIGN, ...JSON.parse(raw) } : DEFAULT_DESIGN;
  } catch {
    return DEFAULT_DESIGN;
  }
}

export function saveDesign(restaurantId: string, design: RestaurantDesign) {
  localStorage.setItem(`${STORAGE_KEY}_${restaurantId}`, JSON.stringify(design));
}

export function radiusClass(design: RestaurantDesign): string {
  return design.cardRadius === "sharp"
    ? "rounded-lg"
    : design.cardRadius === "pill"
      ? "rounded-3xl"
      : "rounded-2xl";
}
