export interface MenuThemeColors {
  headerBackgroundColor: string;
  categoryStripBackgroundColor: string;
  categoryAccentColor: string;
  mainContentBackgroundColor: string;
  footerBackgroundColor: string;
}

/** Canonical theme defaults — keep in sync with DEFAULT_DESIGN in restaurant-design.ts */
export const DEFAULT_MENU_THEME: MenuThemeColors = {
  headerBackgroundColor: "#ffffff",
  categoryStripBackgroundColor: "#f3f4f6",
  categoryAccentColor: "#047857",
  mainContentBackgroundColor: "#fafafa",
  footerBackgroundColor: "#ffffff",
};

/** Ensures a valid #rrggbb value for color inputs and contrast checks. */
export function normalizeHexColor(input: unknown, fallback: string): string {
  if (typeof input !== "string") return fallback;

  const trimmed = input.trim();
  if (!trimmed) return fallback;

  let hex = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;

  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return `#${hex.toLowerCase()}`;
  }

  return fallback;
}

export function parseMenuThemeColors(raw: unknown): MenuThemeColors {
  const theme =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const pick = (keys: string[], fallback: string) => {
    for (const key of keys) {
      const value = theme[key];
      if (typeof value === "string" && value.length > 0) {
        return normalizeHexColor(value, fallback);
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
    headerBackgroundColor: normalizeHexColor(
      colors.headerBackgroundColor,
      DEFAULT_MENU_THEME.headerBackgroundColor
    ),
    categoryStripBackgroundColor: normalizeHexColor(
      colors.categoryStripBackgroundColor,
      DEFAULT_MENU_THEME.categoryStripBackgroundColor
    ),
    categoryAccentColor: normalizeHexColor(
      colors.categoryAccentColor,
      DEFAULT_MENU_THEME.categoryAccentColor
    ),
    mainContentBackgroundColor: normalizeHexColor(
      colors.mainContentBackgroundColor,
      DEFAULT_MENU_THEME.mainContentBackgroundColor
    ),
    footerBackgroundColor: normalizeHexColor(
      colors.footerBackgroundColor,
      DEFAULT_MENU_THEME.footerBackgroundColor
    ),
  };
}
