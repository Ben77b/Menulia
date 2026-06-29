import { contrastingTextColor } from "./contrast";
import {
  resolveMenuTheme,
  type AdvancedTheme,
  type ResolvedMenuTheme,
  type ThemeHotspotId,
} from "./advanced-theme";
import {
  DEFAULT_MENU_THEME,
  normalizeHexColor,
  type MenuThemeColors,
} from "./theme-colors";
import type { RestaurantDesign } from "./restaurant-design";
import type { BasicColorField } from "./theme-color-fields";
import { readBasicColor, writeBasicColorPatch } from "./theme-color-fields";

export const THEME_OVERRIDE_META_KEY = "_overrides" as const;

export interface ThemeChildField {
  id: keyof AdvancedTheme;
  label: string;
}

export interface ThemeHotspotGroup {
  hotspot: ThemeHotspotId;
  title: string;
  parentLabel: string;
  parentBasicField: BasicColorField;
  childFields: ThemeChildField[];
}

export const THEME_HOTSPOT_GROUPS: ThemeHotspotGroup[] = [
  {
    hotspot: "header",
    title: "Header",
    parentLabel: "Header Background",
    parentBasicField: "headerBackgroundColor",
    childFields: [
      { id: "logoAreaText", label: "Logo Area Text & Icons" },
      { id: "carouselArrowBg", label: "Navigation Arrow Circles" },
      { id: "carouselArrowIcon", label: "Arrow Icon" },
    ],
  },
  {
    hotspot: "categoryBar",
    title: "Category Bar",
    parentLabel: "Category Bar Background",
    parentBasicField: "categoryStripBackgroundColor",
    childFields: [
      { id: "categoryBarBg", label: "Bar Background" },
      { id: "tier2ActiveBg", label: "Active Tab Background" },
      { id: "tier2ActiveText", label: "Active Tab Text" },
      { id: "tier2ActiveBorder", label: "Active Tab Border" },
      { id: "tier2InactiveText", label: "Inactive Tab Text" },
      { id: "tier2InactiveBorder", label: "Inactive Tab Border" },
    ],
  },
  {
    hotspot: "menuItem",
    title: "Menu Items",
    parentLabel: "Card Background",
    parentBasicField: "mainContentBackgroundColor",
    childFields: [
      { id: "menuBackground", label: "Menu Background" },
      { id: "itemTitleText", label: "Dish Title" },
      { id: "itemDescriptionText", label: "Description Text" },
      { id: "priceTextColor", label: "Price Text" },
      { id: "dividerLineColor", label: "Divider Line" },
    ],
  },
  {
    hotspot: "carousel",
    title: "Carousel",
    parentLabel: "Accent Color",
    parentBasicField: "categoryAccentColor",
    childFields: [
      { id: "carouselActiveIndicator", label: "Active Indicator" },
      { id: "carouselInactiveDots", label: "Inactive Dots" },
      { id: "carouselArrowIcon", label: "Arrow Icon" },
    ],
  },
  {
    hotspot: "footer",
    title: "Footer",
    parentLabel: "Footer Background",
    parentBasicField: "footerBackgroundColor",
    childFields: [
      { id: "footerBackground", label: "Footer Background" },
      { id: "footerTextIcon", label: "Footer Text & Icons" },
    ],
  },
  {
    hotspot: "filters",
    title: "Tags & Filters",
    parentLabel: "Tags Section Background",
    parentBasicField: "footerBackgroundColor",
    childFields: [
      { id: "filterAreaBg", label: "Tags Area Background" },
      { id: "filterText", label: "Tags Text" },
      { id: "filterBorder", label: "Tags Border" },
    ],
  },
];

export function getHotspotGroup(hotspot: ThemeHotspotId): ThemeHotspotGroup {
  return (
    THEME_HOTSPOT_GROUPS.find((group) => group.hotspot === hotspot) ??
    THEME_HOTSPOT_GROUPS[0]
  );
}

export function parseThemeOverrides(raw: unknown): Set<string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return new Set();
  }
  const list = (raw as Record<string, unknown>)[THEME_OVERRIDE_META_KEY];
  if (!Array.isArray(list)) {
    return new Set();
  }
  return new Set(list.filter((item): item is string => typeof item === "string"));
}

export function splitAdvancedThemeStorage(raw: unknown): {
  theme: Partial<AdvancedTheme>;
  overrides: Set<string>;
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { theme: {}, overrides: new Set() };
  }

  const source = raw as Record<string, unknown>;
  const overrides = parseThemeOverrides(raw);
  const theme: Partial<AdvancedTheme> = {};

  for (const key of Object.keys(source) as (keyof AdvancedTheme)[]) {
    if (key === (THEME_OVERRIDE_META_KEY as unknown as keyof AdvancedTheme)) continue;
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      theme[key] = normalizeHexColor(value, "#000000");
    }
  }

  if (overrides.size === 0) {
    for (const key of Object.keys(theme) as (keyof AdvancedTheme)[]) {
      overrides.add(key);
    }
  }

  return { theme, overrides };
}

export function serializeAdvancedThemeWithOverrides(
  theme: Partial<AdvancedTheme>,
  overrides: Set<string>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const activeOverrides = [...overrides].filter((key) => {
    const value = theme[key as keyof AdvancedTheme];
    return typeof value === "string" && value.trim();
  });

  for (const key of activeOverrides) {
    const value = theme[key as keyof AdvancedTheme];
    if (typeof value === "string" && value.trim()) {
      payload[key] = normalizeHexColor(value, "#000000");
    }
  }

  if (activeOverrides.length > 0) {
    payload[THEME_OVERRIDE_META_KEY] = activeOverrides;
  }

  return payload;
}

export function isAdvancedFieldOverridden(
  fieldId: keyof AdvancedTheme,
  overrides: Set<string>
): boolean {
  return overrides.has(fieldId);
}

export function resolveUnifiedMenuTheme(
  basic: MenuThemeColors,
  advanced: Partial<AdvancedTheme>,
  overrides: Set<string>
): ResolvedMenuTheme {
  const inheritedAdvanced: Partial<AdvancedTheme> = {};

  for (const key of Object.keys(advanced) as (keyof AdvancedTheme)[]) {
    if (overrides.has(key)) {
      inheritedAdvanced[key] = advanced[key];
    }
  }

  return resolveMenuTheme(basic, inheritedAdvanced);
}

export function getGroupParentColor(
  group: ThemeHotspotGroup,
  design: RestaurantDesign
): string {
  return readBasicColor(design, group.parentBasicField);
}

const BASIC_FIELD_GROUPS: Partial<Record<BasicColorField, ThemeHotspotId[]>> = {
  headerBackgroundColor: ["header"],
  headerNavBg: ["header"],
  categoryStripBackgroundColor: ["categoryBar"],
  categoryAccentColor: ["categoryBar", "carousel"],
  mainContentBackgroundColor: ["menuItem"],
  footerBackgroundColor: ["footer", "filters"],
};

export function groupsForBasicField(field: BasicColorField): ThemeHotspotGroup[] {
  const hotspotIds = BASIC_FIELD_GROUPS[field] ?? [];
  return THEME_HOTSPOT_GROUPS.filter((group) => hotspotIds.includes(group.hotspot));
}

export function clearGroupChildOverrides(
  group: ThemeHotspotGroup,
  advanced: Partial<AdvancedTheme>,
  overrides: Set<string>
): { advanced: Partial<AdvancedTheme>; overrides: Set<string> } {
  const nextAdvanced = { ...advanced };
  const nextOverrides = new Set(overrides);

  for (const child of group.childFields) {
    delete nextAdvanced[child.id];
    nextOverrides.delete(child.id);
  }

  if (group.hotspot === "header") {
    delete nextAdvanced.carouselArrowBg;
    nextOverrides.delete("carouselArrowBg");
  }

  if (group.hotspot === "categoryBar") {
    delete nextAdvanced.tier1ActiveBg;
    delete nextAdvanced.tier1ActiveText;
    delete nextAdvanced.tier1ActiveBorder;
    delete nextAdvanced.tier1InactiveBg;
    delete nextAdvanced.tier1InactiveText;
    delete nextAdvanced.tier1InactiveBorder;
    nextOverrides.delete("tier1ActiveBg");
    nextOverrides.delete("tier1ActiveText");
    nextOverrides.delete("tier1ActiveBorder");
    nextOverrides.delete("tier1InactiveBg");
    nextOverrides.delete("tier1InactiveText");
    nextOverrides.delete("tier1InactiveBorder");
  }

  return { advanced: nextAdvanced, overrides: nextOverrides };
}

export function setGroupParentColor(
  group: ThemeHotspotGroup,
  color: string,
  advanced: Partial<AdvancedTheme>,
  overrides: Set<string>
): {
  designPatch: ReturnType<typeof writeBasicColorPatch>;
  advanced: Partial<AdvancedTheme>;
  overrides: Set<string>;
} {
  const normalized = normalizeHexColor(color, "#ffffff");
  const designPatch = writeBasicColorPatch(group.parentBasicField, normalized);
  const cleared = clearGroupChildOverrides(group, advanced, overrides);

  return {
    designPatch,
    advanced: cleared.advanced,
    overrides: cleared.overrides,
  };
}

export function setChildOverride(
  fieldId: keyof AdvancedTheme,
  color: string,
  advanced: Partial<AdvancedTheme>,
  overrides: Set<string>
): { advanced: Partial<AdvancedTheme>; overrides: Set<string> } {
  const normalized = normalizeHexColor(color, "#000000");
  const nextOverrides = new Set(overrides);
  nextOverrides.add(fieldId);
  return {
    advanced: { ...advanced, [fieldId]: normalized },
    overrides: nextOverrides,
  };
}

export function clearChildOverride(
  fieldId: keyof AdvancedTheme,
  advanced: Partial<AdvancedTheme>,
  overrides: Set<string>
): { advanced: Partial<AdvancedTheme>; overrides: Set<string> } {
  const nextAdvanced = { ...advanced };
  delete nextAdvanced[fieldId];
  const nextOverrides = new Set(overrides);
  nextOverrides.delete(fieldId);
  return { advanced: nextAdvanced, overrides: nextOverrides };
}

export function getEffectiveChildColor(
  fieldId: keyof AdvancedTheme,
  basic: MenuThemeColors,
  advanced: Partial<AdvancedTheme>,
  overrides: Set<string>
): string {
  return resolveUnifiedMenuTheme(basic, advanced, overrides)[
    mapAdvancedFieldToResolved(fieldId)
  ];
}

function mapAdvancedFieldToResolved(
  fieldId: keyof AdvancedTheme
): keyof ResolvedMenuTheme {
  const map: Partial<Record<keyof AdvancedTheme, keyof ResolvedMenuTheme>> = {
    menuBackground: "menuBackground",
    dividerLineColor: "dividerLineColor",
    logoAreaBg: "logoAreaBg",
    logoAreaText: "logoAreaText",
    categoryBarBg: "categoryBarBg",
    tier1ActiveBg: "tier1ActiveBg",
    tier1ActiveText: "tier1ActiveText",
    tier1ActiveBorder: "tier1ActiveBorder",
    tier1InactiveBg: "tier1InactiveBg",
    tier1InactiveText: "tier1InactiveText",
    tier1InactiveBorder: "tier1InactiveBorder",
    tier2ActiveBg: "tier2ActiveBg",
    tier2ActiveText: "tier2ActiveText",
    tier2ActiveBorder: "tier2ActiveBorder",
    tier2InactiveBg: "tier2InactiveBg",
    tier2InactiveText: "tier2InactiveText",
    tier2InactiveBorder: "tier2InactiveBorder",
    itemTitleText: "itemTitleText",
    itemDescriptionText: "itemDescriptionText",
    priceTextColor: "priceTextColor",
    carouselActiveIndicator: "carouselActiveIndicator",
    carouselInactiveDots: "carouselInactiveDots",
    carouselArrowBg: "carouselArrowBg",
    carouselArrowIcon: "carouselArrowIcon",
    footerBackground: "footerBackgroundColor",
    footerTextIcon: "footerTextIcon",
    filterAreaBg: "filterAreaBg",
    filterText: "filterText",
    filterBorder: "filterBorder",
  };
  return map[fieldId] ?? "menuBackground";
}

export function defaultBasicColors(): MenuThemeColors {
  return { ...DEFAULT_MENU_THEME };
}

export function inheritedChildHint(
  fieldId: keyof AdvancedTheme,
  parentColor: string
): string {
  if (
    fieldId === "itemTitleText" ||
    fieldId === "itemDescriptionText" ||
    fieldId === "priceTextColor" ||
    fieldId === "filterText" ||
    fieldId === "footerTextIcon" ||
    fieldId === "tier2InactiveText" ||
    fieldId === "tier2ActiveText" ||
    fieldId === "carouselArrowIcon"
  ) {
    return contrastingTextColor(parentColor);
  }
  return parentColor;
}
