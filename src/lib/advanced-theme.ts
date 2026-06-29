import { contrastingTextColor } from "./contrast";
import {
  DEFAULT_MENU_THEME,
  normalizeHexColor,
  type MenuThemeColors,
} from "./theme-colors";
import type { ThemeMode } from "./theme-mode";

/** Granular color overrides stored in restaurants.advanced_theme */
export interface AdvancedTheme {
  menuBackground?: string;
  dividerLineColor?: string;
  logoAreaBg?: string;
  logoAreaText?: string;
  categoryBarBg?: string;
  tier1ActiveBg?: string;
  tier1ActiveText?: string;
  tier1ActiveBorder?: string;
  tier1InactiveBg?: string;
  tier1InactiveText?: string;
  tier1InactiveBorder?: string;
  tier2ActiveBg?: string;
  tier2ActiveText?: string;
  tier2ActiveBorder?: string;
  tier2InactiveBg?: string;
  tier2InactiveText?: string;
  tier2InactiveBorder?: string;
  itemTitleText?: string;
  itemDescriptionText?: string;
  priceTextColor?: string;
  carouselActiveIndicator?: string;
  carouselInactiveDots?: string;
  carouselArrowBg?: string;
  carouselArrowIcon?: string;
  footerBackground?: string;
  footerTextIcon?: string;
  filterAreaBg?: string;
  filterText?: string;
  filterBorder?: string;
}

export type ThemeHotspotId =
  | "header"
  | "categoryBar"
  | "menuItem"
  | "carousel"
  | "footer"
  | "filters";

/** Human-readable labels for hotspot popovers */
export const HOTSPOT_LABELS: Record<ThemeHotspotId, string> = {
  header: "Logo Area Background",
  categoryBar: "Category Bar Background",
  menuItem: "Item Title Text",
  carousel: "Carousel Navigation",
  footer: "Footer Background",
  filters: "Filter Area Background",
};

export interface ThemePickerField {
  id: keyof AdvancedTheme | "headerNavBg" | "mainContentBg";
  label: string;
  fallbackKey?: keyof MenuThemeColors;
}

/** First picker id in each hotspot group — used for scroll-to on preview click */
export const HOTSPOT_PRIMARY_PICKER: Record<ThemeHotspotId, keyof AdvancedTheme | "headerNavBg" | "mainContentBg"> = {
  header: "logoAreaBg",
  categoryBar: "categoryBarBg",
  menuItem: "itemTitleText",
  carousel: "carouselArrowBg",
  footer: "footerBackground",
  filters: "filterAreaBg",
};

/** Fields editable from each preview hotspot popover (advanced layer) */
export const HOTSPOT_POPOVER_FIELDS: Record<ThemeHotspotId, ThemePickerField[]> = {
  header: [{ id: "logoAreaBg", label: "Logo Area BG", fallbackKey: "headerBackgroundColor" }],
  categoryBar: [
    { id: "categoryBarBg", label: "Category Bar BG", fallbackKey: "categoryStripBackgroundColor" },
    { id: "tier2ActiveBg", label: "Active Tab BG", fallbackKey: "categoryAccentColor" },
    { id: "tier2ActiveText", label: "Active Tab Text" },
    { id: "tier2ActiveBorder", label: "Active Tab Border" },
    { id: "tier2InactiveText", label: "Inactive Tab Text" },
    { id: "tier2InactiveBorder", label: "Inactive Tab Border" },
  ],
  menuItem: [
    { id: "menuBackground", label: "Menu Background", fallbackKey: "mainContentBackgroundColor" },
    { id: "itemTitleText", label: "Item Title Text" },
    { id: "itemDescriptionText", label: "Item Description Text" },
    { id: "priceTextColor", label: "Price Text Color", fallbackKey: "categoryAccentColor" },
  ],
  carousel: [
    { id: "carouselArrowBg", label: "Navigation Arrow Circles", fallbackKey: "categoryAccentColor" },
    { id: "carouselArrowIcon", label: "Navigation Arrow Icon" },
    { id: "carouselActiveIndicator", label: "Active Indicator Pill", fallbackKey: "categoryAccentColor" },
    { id: "carouselInactiveDots", label: "Inactive Dots" },
  ],
  footer: [
    { id: "footerBackground", label: "Footer Background", fallbackKey: "footerBackgroundColor" },
    { id: "footerTextIcon", label: "Footer Text / Icon Color" },
  ],
  filters: [
    { id: "filterAreaBg", label: "Filter Area Background", fallbackKey: "footerBackgroundColor" },
    { id: "filterText", label: "Filter Text Color" },
    { id: "filterBorder", label: "Filter Border Color" },
  ],
};

export interface ThemePickerSection {
  title: string;
  hotspot: ThemeHotspotId;
  fields: ThemePickerField[];
}

export const ADVANCED_THEME_SECTIONS: ThemePickerSection[] = [
  {
    title: "Header & Nav",
    hotspot: "header",
    fields: [
      { id: "logoAreaBg", label: "Logo Area BG", fallbackKey: "headerBackgroundColor" },
      { id: "categoryBarBg", label: "Category Bar BG", fallbackKey: "categoryStripBackgroundColor" },
      { id: "tier2ActiveBg", label: "Active Category Button BG", fallbackKey: "categoryAccentColor" },
      { id: "tier2ActiveText", label: "Active Category Button Text" },
      { id: "tier2InactiveText", label: "Inactive Category Button Text" },
      { id: "tier2InactiveBorder", label: "Inactive Category Button Border" },
    ],
  },
  {
    title: "Menu Items",
    hotspot: "menuItem",
    fields: [
      { id: "menuBackground", label: "Menu Background", fallbackKey: "mainContentBackgroundColor" },
      { id: "itemTitleText", label: "Item Title Text" },
      { id: "itemDescriptionText", label: "Item Description Text" },
      { id: "priceTextColor", label: "Price Text Color", fallbackKey: "categoryAccentColor" },
    ],
  },
  {
    title: "Footer & Filters",
    hotspot: "footer",
    fields: [
      { id: "footerBackground", label: "Footer Background", fallbackKey: "footerBackgroundColor" },
      { id: "footerTextIcon", label: "Footer Text / Icon Color" },
      { id: "filterAreaBg", label: "Filter Area Background", fallbackKey: "footerBackgroundColor" },
      { id: "filterText", label: "Filter Text Color" },
      { id: "filterBorder", label: "Filter Border Color" },
    ],
  },
  {
    title: "Carousel & Navigation",
    hotspot: "carousel",
    fields: [
      { id: "carouselActiveIndicator", label: "Active Indicator Pill", fallbackKey: "categoryAccentColor" },
      { id: "carouselInactiveDots", label: "Inactive Dots" },
      { id: "carouselArrowBg", label: "Navigation Arrow Circles", fallbackKey: "categoryAccentColor" },
      { id: "carouselArrowIcon", label: "Navigation Arrow Icon" },
    ],
  },
];

export interface ResolvedMenuTheme extends MenuThemeColors {
  menuBackground: string;
  dividerLineColor: string;
  logoAreaBg: string;
  logoAreaText: string;
  categoryBarBg: string;
  tier1ActiveBg: string;
  tier1ActiveText: string;
  tier1ActiveBorder: string;
  tier1InactiveBg: string;
  tier1InactiveText: string;
  tier1InactiveBorder: string;
  tier2ActiveBg: string;
  tier2ActiveText: string;
  tier2ActiveBorder: string;
  tier2InactiveBg: string;
  tier2InactiveText: string;
  tier2InactiveBorder: string;
  itemTitleText: string;
  itemDescriptionText: string;
  priceTextColor: string;
  carouselActiveIndicator: string;
  carouselInactiveDots: string;
  carouselArrowBg: string;
  carouselArrowIcon: string;
  footerTextIcon: string;
  filterAreaBg: string;
  filterText: string;
  filterBorder: string;
}

function pickColor(
  advanced: Partial<AdvancedTheme>,
  key: keyof AdvancedTheme,
  fallback: string
): string {
  const raw = advanced[key];
  if (typeof raw === "string" && raw.trim()) {
    return normalizeHexColor(raw, fallback);
  }
  return normalizeHexColor(fallback, fallback);
}

export function parseAdvancedTheme(raw: unknown): Partial<AdvancedTheme> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const source = raw as Record<string, unknown>;
  const result: Partial<AdvancedTheme> = {};

  for (const key of Object.keys(source)) {
    if (key === "_overrides") continue;
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      result[key as keyof AdvancedTheme] = normalizeHexColor(value, "#000000");
    }
  }

  return result;
}

export function serializeAdvancedTheme(theme: Partial<AdvancedTheme>): Partial<AdvancedTheme> {
  const out: Partial<AdvancedTheme> = {};
  for (const [key, value] of Object.entries(theme) as [keyof AdvancedTheme, string | undefined][]) {
    if (typeof value === "string" && value.trim()) {
      out[key] = normalizeHexColor(value, "#000000");
    }
  }
  return out;
}

/** Static defaults for advanced layer — no auto-contrast derivation */
export const ADVANCED_FIELD_DEFAULTS: Record<keyof AdvancedTheme, string> = {
  menuBackground: DEFAULT_MENU_THEME.mainContentBackgroundColor,
  dividerLineColor: "#00000014",
  logoAreaBg: DEFAULT_MENU_THEME.headerBackgroundColor,
  logoAreaText: "#111827",
  categoryBarBg: DEFAULT_MENU_THEME.categoryStripBackgroundColor,
  tier1ActiveBg: "#111827",
  tier1ActiveText: "#ffffff",
  tier1ActiveBorder: "#111827",
  tier1InactiveBg: "transparent",
  tier1InactiveText: "#374151",
  tier1InactiveBorder: "#374151",
  tier2ActiveBg: DEFAULT_MENU_THEME.categoryAccentColor,
  tier2ActiveText: "#ffffff",
  tier2ActiveBorder: DEFAULT_MENU_THEME.categoryAccentColor,
  tier2InactiveBg: "transparent",
  tier2InactiveText: "#6b7280",
  tier2InactiveBorder: "#9ca3af",
  itemTitleText: "#111827",
  itemDescriptionText: "#4b5563",
  priceTextColor: DEFAULT_MENU_THEME.categoryAccentColor,
  carouselActiveIndicator: DEFAULT_MENU_THEME.categoryAccentColor,
  carouselInactiveDots: "#00000033",
  carouselArrowBg: DEFAULT_MENU_THEME.headerBackgroundColor,
  carouselArrowIcon: "#111827",
  footerBackground: DEFAULT_MENU_THEME.footerBackgroundColor,
  footerTextIcon: "#111827",
  filterAreaBg: DEFAULT_MENU_THEME.footerBackgroundColor,
  filterText: "#111827",
  filterBorder: "#d1d5db",
};

export function getAdvancedFieldDefault(key: keyof AdvancedTheme): string {
  return ADVANCED_FIELD_DEFAULTS[key];
}

function readAdvancedColor(
  advanced: Partial<AdvancedTheme>,
  key: keyof AdvancedTheme
): string {
  const fallback = ADVANCED_FIELD_DEFAULTS[key];
  const raw = advanced[key];
  if (typeof raw === "string" && raw.trim()) {
    return normalizeHexColor(raw, fallback);
  }
  return fallback;
}

/** Basic layer: macro colours with auto-contrast text derivation */
export function resolveBasicMenuTheme(basic: MenuThemeColors): ResolvedMenuTheme {
  return resolveMenuTheme(basic, {});
}

/** Advanced layer: granular colours only — no auto-contrast fallbacks */
export function resolveAdvancedMenuTheme(advanced: Partial<AdvancedTheme>): ResolvedMenuTheme {
  const logoAreaBg = readAdvancedColor(advanced, "logoAreaBg");
  const categoryBarBg = readAdvancedColor(advanced, "categoryBarBg");
  const menuBackground = readAdvancedColor(advanced, "menuBackground");
  const footerBackground = readAdvancedColor(advanced, "footerBackground");
  const tier2ActiveBg = readAdvancedColor(advanced, "tier2ActiveBg");
  const tier2ActiveText = readAdvancedColor(advanced, "tier2ActiveText");
  const tier2ActiveBorder = readAdvancedColor(advanced, "tier2ActiveBorder");
  const tier2InactiveBg = readAdvancedColor(advanced, "tier2InactiveBg");
  const tier2InactiveText = readAdvancedColor(advanced, "tier2InactiveText");
  const tier2InactiveBorder = readAdvancedColor(advanced, "tier2InactiveBorder");
  const carouselArrowBgDefault = readAdvancedColor(advanced, "carouselArrowBg");
  const carouselArrowBg =
    advanced.carouselArrowBg?.trim()
      ? carouselArrowBgDefault
      : logoAreaBg;

  return {
    headerBackgroundColor: logoAreaBg,
    categoryStripBackgroundColor: categoryBarBg,
    categoryAccentColor: tier2ActiveBg,
    mainContentBackgroundColor: menuBackground,
    footerBackgroundColor: footerBackground,

    menuBackground,
    dividerLineColor: readAdvancedColor(advanced, "dividerLineColor"),

    logoAreaBg,
    logoAreaText: readAdvancedColor(advanced, "logoAreaText"),
    categoryBarBg,

    tier1ActiveBg: tier2ActiveBg,
    tier1ActiveText: tier2ActiveText,
    tier1ActiveBorder: tier2ActiveBorder,
    tier1InactiveBg: tier2InactiveBg,
    tier1InactiveText: tier2InactiveText,
    tier1InactiveBorder: tier2InactiveBorder,

    tier2ActiveBg,
    tier2ActiveText,
    tier2ActiveBorder,
    tier2InactiveBg,
    tier2InactiveText,
    tier2InactiveBorder,

    itemTitleText: readAdvancedColor(advanced, "itemTitleText"),
    itemDescriptionText: readAdvancedColor(advanced, "itemDescriptionText"),
    priceTextColor: readAdvancedColor(advanced, "priceTextColor"),

    carouselActiveIndicator: readAdvancedColor(advanced, "carouselActiveIndicator"),
    carouselInactiveDots: readAdvancedColor(advanced, "carouselInactiveDots"),
    carouselArrowBg,
    carouselArrowIcon:
      typeof advanced.carouselArrowIcon === "string" && advanced.carouselArrowIcon.trim()
        ? normalizeHexColor(advanced.carouselArrowIcon, contrastingTextColor(carouselArrowBg))
        : contrastingTextColor(carouselArrowBg),

    footerTextIcon: readAdvancedColor(advanced, "footerTextIcon"),
    filterAreaBg: readAdvancedColor(advanced, "filterAreaBg"),
    filterText: readAdvancedColor(advanced, "filterText"),
    filterBorder: readAdvancedColor(advanced, "filterBorder"),
  };
}

export function resolveMenuThemeForMode(
  mode: ThemeMode,
  basic: MenuThemeColors,
  advanced: Partial<AdvancedTheme> = {}
): ResolvedMenuTheme {
  if (mode === "advanced") {
    return resolveAdvancedMenuTheme(advanced);
  }
  return resolveBasicMenuTheme(basic);
}

export function resolveMenuTheme(
  basic: MenuThemeColors,
  advanced: Partial<AdvancedTheme> = {}
): ResolvedMenuTheme {
  const headerBg = normalizeHexColor(basic.headerBackgroundColor, DEFAULT_MENU_THEME.headerBackgroundColor);
  const stripBg = normalizeHexColor(
    basic.categoryStripBackgroundColor,
    DEFAULT_MENU_THEME.categoryStripBackgroundColor
  );
  const accent = normalizeHexColor(basic.categoryAccentColor, DEFAULT_MENU_THEME.categoryAccentColor);
  const mainBg = normalizeHexColor(
    basic.mainContentBackgroundColor,
    DEFAULT_MENU_THEME.mainContentBackgroundColor
  );
  const footerBg = normalizeHexColor(basic.footerBackgroundColor, DEFAULT_MENU_THEME.footerBackgroundColor);

  const logoAreaBg = pickColor(advanced, "logoAreaBg", headerBg);
  const categoryBarBg = pickColor(advanced, "categoryBarBg", stripBg);
  const menuBackground = pickColor(advanced, "menuBackground", mainBg);
  const footerBackground = pickColor(advanced, "footerBackground", footerBg);

  const tier2ActiveBgDefault = pickColor(advanced, "tier2ActiveBg", accent);
  const tier2ActiveTextDefault = contrastingTextColor(tier2ActiveBgDefault);
  const stripContrast = contrastingTextColor(categoryBarBg);
  const menuTextContrast = contrastingTextColor(menuBackground);
  const carouselArrowBgDefault = pickColor(advanced, "carouselArrowBg", logoAreaBg);
  const carouselArrowIconDefault = pickColor(
    advanced,
    "carouselArrowIcon",
    contrastingTextColor(carouselArrowBgDefault)
  );

  return {
    headerBackgroundColor: logoAreaBg,
    categoryStripBackgroundColor: categoryBarBg,
    categoryAccentColor: tier2ActiveBgDefault,
    mainContentBackgroundColor: menuBackground,
    footerBackgroundColor: footerBackground,

    menuBackground,
    dividerLineColor: pickColor(
      advanced,
      "dividerLineColor",
      contrastingTextColor(menuBackground) === "#000000" ? "#00000014" : "#ffffff22"
    ),

    logoAreaBg,
    logoAreaText: pickColor(advanced, "logoAreaText", contrastingTextColor(logoAreaBg)),
    categoryBarBg,

    tier1ActiveBg: pickColor(advanced, "tier1ActiveBg", tier2ActiveBgDefault),
    tier1ActiveText: pickColor(advanced, "tier1ActiveText", tier2ActiveTextDefault),
    tier1ActiveBorder: pickColor(advanced, "tier1ActiveBorder", tier2ActiveBgDefault),
    tier1InactiveBg: pickColor(advanced, "tier1InactiveBg", "transparent"),
    tier1InactiveText: pickColor(advanced, "tier1InactiveText", stripContrast),
    tier1InactiveBorder: pickColor(advanced, "tier1InactiveBorder", stripContrast),

    tier2ActiveBg: tier2ActiveBgDefault,
    tier2ActiveText: pickColor(advanced, "tier2ActiveText", tier2ActiveTextDefault),
    tier2ActiveBorder: pickColor(advanced, "tier2ActiveBorder", tier2ActiveBgDefault),
    tier2InactiveBg: pickColor(advanced, "tier2InactiveBg", "transparent"),
    tier2InactiveText: pickColor(advanced, "tier2InactiveText", stripContrast),
    tier2InactiveBorder: pickColor(advanced, "tier2InactiveBorder", stripContrast),

    itemTitleText: pickColor(advanced, "itemTitleText", menuTextContrast),
    itemDescriptionText: pickColor(
      advanced,
      "itemDescriptionText",
      menuTextContrast
    ),
    priceTextColor: pickColor(advanced, "priceTextColor", menuTextContrast),

    carouselActiveIndicator: pickColor(advanced, "carouselActiveIndicator", accent),
    carouselInactiveDots: pickColor(
      advanced,
      "carouselInactiveDots",
      menuTextContrast === "#000000" ? "#00000033" : "#ffffff44"
    ),
    carouselArrowBg: carouselArrowBgDefault,
    carouselArrowIcon: carouselArrowIconDefault,

    footerTextIcon: pickColor(advanced, "footerTextIcon", contrastingTextColor(footerBackground)),
    filterAreaBg: pickColor(advanced, "filterAreaBg", footerBackground),
    filterText: pickColor(advanced, "filterText", contrastingTextColor(footerBackground)),
    filterBorder: pickColor(
      advanced,
      "filterBorder",
      contrastingTextColor(footerBackground)
    ),
  };
}

export function basicThemeFromResolved(resolved: ResolvedMenuTheme): MenuThemeColors {
  return {
    headerBackgroundColor: resolved.headerBackgroundColor,
    categoryStripBackgroundColor: resolved.categoryStripBackgroundColor,
    categoryAccentColor: resolved.categoryAccentColor,
    mainContentBackgroundColor: resolved.mainContentBackgroundColor,
    footerBackgroundColor: resolved.footerBackgroundColor,
  };
}
