import type { CSSProperties } from "react";
import type { RestaurantDesign } from "./restaurant-design";

export type FontWeight = 400 | 700;
export type FontStyle = "normal" | "italic";

export interface RestaurantTypography {
  titleFont: string;
  textFont: string;
  titleFontWeight: FontWeight;
  textFontWeight: FontWeight;
  titleFontStyle: FontStyle;
  textFontStyle: FontStyle;
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

  return {
    titleFont,
    textFont,
    titleFontWeight: parseFontWeight(source.titleFontWeight),
    textFontWeight: parseFontWeight(source.textFontWeight),
    titleFontStyle: parseFontStyle(source.titleFontStyle),
    textFontStyle: parseFontStyle(source.textFontStyle),
  };
}

export function serializeTypography(
  design: Pick<
    RestaurantDesign,
    | "titleFont"
    | "textFont"
    | "titleFontWeight"
    | "textFontWeight"
    | "titleFontStyle"
    | "textFontStyle"
  >
): Record<string, string | number> {
  return {
    titleFont: design.titleFont,
    textFont: design.textFont,
    titleFontWeight: design.titleFontWeight,
    textFontWeight: design.textFontWeight,
    titleFontStyle: design.titleFontStyle,
    textFontStyle: design.textFontStyle,
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
