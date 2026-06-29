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
  description: string;
}

export interface ThemeHotspotGroup {
  hotspot: ThemeHotspotId;
  title: string;
  parentLabel: string;
  parentDescription: string;
  parentBasicField: BasicColorField;
  childFields: ThemeChildField[];
}

export const THEME_HOTSPOT_GROUPS: ThemeHotspotGroup[] = [
  {
    hotspot: "header",
    title: "Header",
    parentLabel: "Header Background",
    parentDescription: "Sets the background behind your logo and restaurant name at the top of the menu.",
    parentBasicField: "headerBackgroundColor",
    childFields: [
      {
        id: "logoAreaText",
        label: "Logo Area Text & Icons",
        description: "Changes the color of your restaurant name, logo accents, and header icons.",
      },
    ],
  },
  {
    hotspot: "categoryBar",
    title: "Category Bar",
    parentLabel: "Category Bar Background",
    parentDescription: "Sets the background color of the horizontal category navigation strip.",
    parentBasicField: "categoryStripBackgroundColor",
    childFields: [
      {
        id: "categoryBarBg",
        label: "Bar Background",
        description: "Fine-tune the category strip background independently from the parent color.",
      },
      {
        id: "tier2ActiveBg",
        label: "Active Tab Background",
        description: "Background color of the currently selected category tab.",
      },
      {
        id: "tier2ActiveText",
        label: "Active Tab Text",
        description: "Text color on the active category tab.",
      },
      {
        id: "tier2ActiveBorder",
        label: "Active Tab Border",
        description: "Border color outlining the active category tab.",
      },
      {
        id: "tier2InactiveText",
        label: "Inactive Tab Text",
        description: "Text color for categories that are not currently selected.",
      },
      {
        id: "tier2InactiveBorder",
        label: "Inactive Tab Border",
        description: "Border color for unselected category tabs.",
      },
    ],
  },
  {
    hotspot: "menuItem",
    title: "Menu Items",
    parentLabel: "Card Background",
    parentDescription: "Sets the main content area background behind your dish cards and carousel layouts.",
    parentBasicField: "mainContentBackgroundColor",
    childFields: [
      {
        id: "menuBackground",
        label: "Menu Background",
        description: "Fine-tune the main menu content background independently from the parent color.",
      },
      {
        id: "itemTitleText",
        label: "Dish Title Color",
        description: "Changes the font color of your main menu item names.",
      },
      {
        id: "itemDescriptionText",
        label: "Description Text Color",
        description: "Changes the font color of dish descriptions below each title.",
      },
      {
        id: "priceTextColor",
        label: "Price Text Color",
        description: "Changes the font color of dish prices on your menu.",
      },
      {
        id: "dividerLineColor",
        label: "Divider Line Color",
        description: "Color of subtle separator lines between menu sections.",
      },
      {
        id: "carouselArrowBg",
        label: "Navigation Arrow Circles",
        description: "Background color of the left and right carousel navigation buttons.",
      },
      {
        id: "carouselArrowIcon",
        label: "Navigation Arrow Icons",
        description: "Icon color inside the carousel left and right navigation buttons.",
      },
      {
        id: "carouselActiveIndicator",
        label: "Active Carousel Indicator",
        description: "Color of the highlighted dot or pill showing the active carousel slide.",
      },
      {
        id: "carouselInactiveDots",
        label: "Inactive Carousel Dots",
        description: "Color of inactive carousel position indicators.",
      },
    ],
  },
  {
    hotspot: "footer",
    title: "Footer",
    parentLabel: "Footer Background",
    parentDescription: "Sets the background color of the bottom footer area with contact details.",
    parentBasicField: "footerBackgroundColor",
    childFields: [
      {
        id: "footerBackground",
        label: "Footer Background",
        description: "Fine-tune the footer background independently from the parent color.",
      },
      {
        id: "footerTextIcon",
        label: "Footer Text & Icons",
        description: "Changes the color of footer text, links, and icons.",
      },
    ],
  },
  {
    hotspot: "filters",
    title: "Tags & Filters",
    parentLabel: "Tags Section Background",
    parentDescription: "Sets the background behind the dietary tag filter bar above the footer.",
    parentBasicField: "footerBackgroundColor",
    childFields: [
      {
        id: "filterAreaBg",
        label: "Tags Area Background",
        description: "Fine-tune the filter bar background independently from the parent color.",
      },
      {
        id: "filterText",
        label: "Tags Text Color",
        description: "Changes the text color on dietary filter tags.",
      },
      {
        id: "filterBorder",
        label: "Tags Border Color",
        description: "Changes the border color around each filter tag.",
      },
    ],
  },
];

/** Sidebar and popover groups — excludes legacy carousel hotspot bucket */
export const THEME_COLOR_PANEL_GROUPS = THEME_HOTSPOT_GROUPS;

export function getHotspotGroup(hotspot: ThemeHotspotId): ThemeHotspotGroup {
  const resolvedHotspot = hotspot === "carousel" ? "menuItem" : hotspot;
  return (
    THEME_HOTSPOT_GROUPS.find((group) => group.hotspot === resolvedHotspot) ??
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

  for (const key of Object.keys(source)) {
    if (key === THEME_OVERRIDE_META_KEY) continue;
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      theme[key as keyof AdvancedTheme] = normalizeHexColor(value, "#000000");
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
  categoryAccentColor: ["categoryBar"],
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
    fieldId === "logoAreaText" ||
    fieldId === "tier2InactiveText" ||
    fieldId === "tier2ActiveText" ||
    fieldId === "carouselArrowIcon"
  ) {
    return contrastingTextColor(parentColor);
  }
  return parentColor;
}
