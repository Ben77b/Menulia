import { DEFAULT_DESIGN } from "./restaurant-design";

export interface MenuThemeColors {
  headerBackgroundColor: string;
  categoryStripBackgroundColor: string;
  categoryAccentColor: string;
  mainContentBackgroundColor: string;
  footerBackgroundColor: string;
}

export const DEFAULT_MENU_THEME: MenuThemeColors = {
  headerBackgroundColor: DEFAULT_DESIGN.headerBackgroundColor,
  categoryStripBackgroundColor: DEFAULT_DESIGN.categoryStripBackgroundColor,
  categoryAccentColor: DEFAULT_DESIGN.categoryAccentColor,
  mainContentBackgroundColor: DEFAULT_DESIGN.mainContentBackgroundColor,
  footerBackgroundColor: DEFAULT_DESIGN.footerBackgroundColor,
};

export function parseMenuThemeColors(raw: unknown): MenuThemeColors {
  const theme =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const pick = (keys: string[], fallback: string) => {
    for (const key of keys) {
      const value = theme[key];
      if (typeof value === "string" && value.length > 0) {
        return value;
      }
    }
    return fallback;
  };

  return {
    headerBackgroundColor: pick(
      ["headerBackgroundColor", "headerFooterBackgroundColor", "headerColor"],
      DEFAULT_MENU_THEME.headerBackgroundColor
    ),
    categoryStripBackgroundColor: pick(
      ["categoryStripBackgroundColor", "categoryBackgroundColor", "color2"],
      DEFAULT_MENU_THEME.categoryStripBackgroundColor
    ),
    categoryAccentColor: pick(
      ["categoryAccentColor", "buttonColor", "categoryBackgroundColor", "color2"],
      DEFAULT_MENU_THEME.categoryAccentColor
    ),
    mainContentBackgroundColor: pick(
      ["mainContentBackgroundColor", "color1", "backgroundColor"],
      DEFAULT_MENU_THEME.mainContentBackgroundColor
    ),
    footerBackgroundColor: pick(
      ["footerBackgroundColor", "headerFooterBackgroundColor", "footerColor"],
      DEFAULT_MENU_THEME.footerBackgroundColor
    ),
  };
}

export function serializeMenuThemeColors(colors: MenuThemeColors): MenuThemeColors {
  return {
    headerBackgroundColor: colors.headerBackgroundColor,
    categoryStripBackgroundColor: colors.categoryStripBackgroundColor,
    categoryAccentColor: colors.categoryAccentColor,
    mainContentBackgroundColor: colors.mainContentBackgroundColor,
    footerBackgroundColor: colors.footerBackgroundColor,
  };
}
