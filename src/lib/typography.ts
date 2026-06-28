import type { CSSProperties } from "react";
import type { RestaurantDesign } from "./restaurant-design";

export type FontWeight = 400 | 700;
export type FontStyle = "normal" | "italic";

export interface RestaurantTypography {
  titleFont: string;
  textFont: string;
  categoryFont: string;
  titleFontWeight: FontWeight;
  textFontWeight: FontWeight;
  categoryFontWeight: FontWeight;
  titleFontStyle: FontStyle;
  textFontStyle: FontStyle;
  categoryFontStyle: FontStyle;
  categoryFontLinkedToTitle: boolean;
}

export function parseFontWeight(value: unknown, fallback: FontWeight = 400): FontWeight {
  if (value === 700 || value === "700") return 700;
  return fallback;
}

export function parseFontStyle(value: unknown, fallback: FontStyle = "normal"): FontStyle {
  if (value === "italic") return "italic";
  return fallback;
}

export function parseTypography(
  raw: unknown,
  defaults: Pick<RestaurantDesign, "titleFont" | "textFont"> = {
    titleFont: "Inter",
    textFont: "Inter",
  }
): RestaurantTypography {
  const source =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  const titleFont =
    typeof source.titleFont === "string" && source.titleFont
      ? source.titleFont
      : defaults.titleFont;
  const textFont =
    typeof source.textFont === "string" && source.textFont ? source.textFont : titleFont;
  const categoryFontLinkedToTitle =
    source.categoryFontLinkedToTitle !== false &&
    source.categoryFontLinkedToTitle !== "false";
  const categoryFont =
    typeof source.categoryFont === "string" && source.categoryFont && !categoryFontLinkedToTitle
      ? source.categoryFont
      : titleFont;

  return {
    titleFont,
    textFont,
    categoryFont,
    titleFontWeight: parseFontWeight(source.titleFontWeight),
    textFontWeight: parseFontWeight(source.textFontWeight),
    categoryFontWeight: parseFontWeight(
      source.categoryFontWeight,
      parseFontWeight(source.titleFontWeight)
    ),
    titleFontStyle: parseFontStyle(source.titleFontStyle),
    textFontStyle: parseFontStyle(source.textFontStyle),
    categoryFontStyle: categoryFontLinkedToTitle
      ? parseFontStyle(source.titleFontStyle)
      : parseFontStyle(source.categoryFontStyle),
    categoryFontLinkedToTitle,
  };
}

export function serializeTypography(
  design: Pick<
    RestaurantDesign,
    | "titleFont"
    | "textFont"
    | "categoryFont"
    | "titleFontWeight"
    | "textFontWeight"
    | "categoryFontWeight"
    | "titleFontStyle"
    | "textFontStyle"
    | "categoryFontStyle"
    | "categoryFontLinkedToTitle"
  >
): Record<string, string | number | boolean> {
  return {
    titleFont: design.titleFont,
    textFont: design.textFont,
    categoryFont: design.categoryFontLinkedToTitle
      ? design.titleFont
      : design.categoryFont,
    titleFontWeight: design.titleFontWeight,
    textFontWeight: design.textFontWeight,
    categoryFontWeight: design.categoryFontLinkedToTitle
      ? design.titleFontWeight
      : design.categoryFontWeight,
    titleFontStyle: design.titleFontStyle,
    textFontStyle: design.textFontStyle,
    categoryFontStyle: design.categoryFontLinkedToTitle
      ? design.titleFontStyle
      : design.categoryFontStyle,
    categoryFontLinkedToTitle: design.categoryFontLinkedToTitle,
  };
}

export function resolveCategoryTypography(
  design: Pick<
    RestaurantDesign,
    | "titleFont"
    | "categoryFont"
    | "titleFontWeight"
    | "categoryFontWeight"
    | "titleFontStyle"
    | "categoryFontStyle"
    | "categoryFontLinkedToTitle"
  >
): Pick<RestaurantTypography, "categoryFont" | "categoryFontWeight" | "categoryFontStyle"> {
  if (design.categoryFontLinkedToTitle) {
    return {
      categoryFont: design.titleFont,
      categoryFontWeight: design.titleFontWeight,
      categoryFontStyle: design.titleFontStyle,
    };
  }
  return {
    categoryFont: design.categoryFont,
    categoryFontWeight: design.categoryFontWeight,
    categoryFontStyle: design.categoryFontStyle,
  };
}

export function categoryFontStyleProps(
  design: Pick<
    RestaurantDesign,
    | "titleFont"
    | "categoryFont"
    | "titleFontWeight"
    | "categoryFontWeight"
    | "titleFontStyle"
    | "categoryFontStyle"
    | "categoryFontLinkedToTitle"
  >
): CSSProperties {
  const category = resolveCategoryTypography(design);
  return {
    fontFamily: category.categoryFont,
    fontWeight: category.categoryFontWeight,
    fontStyle: category.categoryFontStyle,
  };
}

export interface TypographyPreset {
  id: string;
  name: string;
  description: string;
  titleFont: string;
  textFont: string;
  titleFontWeight: FontWeight;
  textFontWeight: FontWeight;
  titleFontStyle: FontStyle;
  textFontStyle: FontStyle;
  previewTitleClass?: string;
  previewBodyClass?: string;
}

export const TYPOGRAPHY_PRESETS: TypographyPreset[] = [
  {
    id: "elegant-dining",
    name: "Elegant Dining",
    description: "Playfair Display + Lato",
    titleFont: "Playfair Display",
    textFont: "Lato",
    titleFontWeight: 400,
    textFontWeight: 400,
    titleFontStyle: "normal",
    textFontStyle: "normal",
    previewTitleClass: "font-[var(--font-playfair-display)]",
    previewBodyClass: "font-[var(--font-lato)]",
  },
  {
    id: "modern-minimalist",
    name: "Modern Minimalist",
    description: "Inter Bold + Inter Regular",
    titleFont: "Inter",
    textFont: "Inter",
    titleFontWeight: 700,
    textFontWeight: 400,
    titleFontStyle: "normal",
    textFontStyle: "normal",
    previewTitleClass: "font-[var(--font-inter)] font-bold",
    previewBodyClass: "font-[var(--font-inter)]",
  },
  {
    id: "vintage-bistro",
    name: "Vintage Bistro",
    description: "Cormorant Garamond + Roboto",
    titleFont: "Cormorant Garamond",
    textFont: "Roboto",
    titleFontWeight: 400,
    textFontWeight: 400,
    titleFontStyle: "normal",
    textFontStyle: "normal",
    previewTitleClass: "font-[var(--font-cormorant-garamond)]",
    previewBodyClass: "font-[var(--font-roboto)]",
  },
  {
    id: "urban-edgy",
    name: "Urban & Edgy",
    description: "Oswald + Montserrat",
    titleFont: "Oswald",
    textFont: "Montserrat",
    titleFontWeight: 700,
    textFontWeight: 400,
    titleFontStyle: "normal",
    textFontStyle: "normal",
    previewTitleClass: "font-[var(--font-oswald)] font-bold uppercase tracking-wide",
    previewBodyClass: "font-[var(--font-montserrat)]",
  },
];

export function typographyPresetToDesignPatch(
  preset: TypographyPreset
): Pick<
  RestaurantDesign,
  | "titleFont"
  | "textFont"
  | "categoryFont"
  | "titleFontWeight"
  | "textFontWeight"
  | "categoryFontWeight"
  | "titleFontStyle"
  | "textFontStyle"
  | "categoryFontStyle"
  | "categoryFontLinkedToTitle"
> {
  return {
    titleFont: preset.titleFont,
    textFont: preset.textFont,
    categoryFont: preset.titleFont,
    titleFontWeight: preset.titleFontWeight,
    textFontWeight: preset.textFontWeight,
    categoryFontWeight: preset.titleFontWeight,
    titleFontStyle: preset.titleFontStyle,
    textFontStyle: preset.textFontStyle,
    categoryFontStyle: preset.titleFontStyle,
    categoryFontLinkedToTitle: true,
  };
}

export function titleFontStyleProps(typography: RestaurantTypography): CSSProperties {
  return {
    fontFamily: typography.titleFont,
    fontWeight: typography.titleFontWeight,
    fontStyle: typography.titleFontStyle,
  };
}

export function mergeFontStyle(
  family: string,
  weight?: number,
  style?: FontStyle,
  extra?: CSSProperties
): CSSProperties {
  return {
    fontFamily: family,
    fontWeight: weight ?? 400,
    fontStyle: style ?? "normal",
    ...extra,
  };
}
