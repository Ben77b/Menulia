import type { ThemeMode } from "./theme-mode";
import type { MenuThemeColors } from "./theme-colors";
import type { AdvancedTheme } from "./advanced-theme";
import type { RestaurantDesign } from "./restaurant-design";
import { themeColorsFromDesign } from "./restaurant-design";
import { normalizeHexColor } from "./theme-colors";
import {
  HOTSPOT_PRIMARY_PICKER,
  HOTSPOT_POPOVER_FIELDS,
  type ThemeHotspotId,
  type ThemePickerField,
} from "./advanced-theme";

/** Basic-layer macro colour fields (stored in theme_colors / design state) */
export type BasicColorField =
  | "headerNavBg"
  | "headerBackgroundColor"
  | "categoryStripBackgroundColor"
  | "categoryAccentColor"
  | "mainContentBackgroundColor"
  | "footerBackgroundColor";

export type ThemeColorFieldId = BasicColorField | keyof AdvancedTheme;

const BASIC_COLOR_FIELDS = new Set<string>([
  "headerNavBg",
  "headerBackgroundColor",
  "categoryStripBackgroundColor",
  "categoryAccentColor",
  "mainContentBackgroundColor",
  "footerBackgroundColor",
]);

export function isBasicColorField(fieldId: ThemeColorFieldId): fieldId is BasicColorField {
  return BASIC_COLOR_FIELDS.has(fieldId);
}

export const HOTSPOT_BASIC_PICKER: Record<ThemeHotspotId, ThemeColorFieldId> = {
  header: "headerNavBg",
  categoryBar: "categoryStripBackgroundColor",
  menuItem: "mainContentBackgroundColor",
  carousel: "categoryAccentColor",
  footer: "footerBackgroundColor",
  filters: "footerBackgroundColor",
};

export function hotspotFieldForMode(
  hotspot: ThemeHotspotId,
  mode: ThemeMode
): ThemeColorFieldId {
  const field =
    mode === "advanced" ? HOTSPOT_PRIMARY_PICKER[hotspot] : HOTSPOT_BASIC_PICKER[hotspot];
  if (field === "mainContentBg") {
    return "mainContentBackgroundColor";
  }
  return field as ThemeColorFieldId;
}

export function readBasicColor(design: RestaurantDesign, field: BasicColorField): string {
  switch (field) {
    case "headerNavBg":
    case "headerBackgroundColor":
      return design.headerBackgroundColor;
    case "categoryStripBackgroundColor":
      return design.categoryStripBackgroundColor;
    case "categoryAccentColor":
      return design.categoryAccentColor;
    case "mainContentBackgroundColor":
      return design.mainContentBackgroundColor;
    case "footerBackgroundColor":
      return design.footerBackgroundColor;
    default:
      return "#ffffff";
  }
}

export function writeBasicColorPatch(
  field: BasicColorField,
  value: string
): Partial<RestaurantDesign> {
  const normalized = normalizeHexColor(value, "#ffffff");
  switch (field) {
    case "headerNavBg":
      return { headerBackgroundColor: normalized, footerBackgroundColor: normalized };
    case "headerBackgroundColor":
      return { headerBackgroundColor: normalized };
    case "categoryStripBackgroundColor":
      return { categoryStripBackgroundColor: normalized };
    case "categoryAccentColor":
      return { categoryAccentColor: normalized };
    case "mainContentBackgroundColor":
      return { mainContentBackgroundColor: normalized };
    case "footerBackgroundColor":
      return { footerBackgroundColor: normalized };
    default:
      return {};
  }
}

export function readThemeColorValue(
  mode: ThemeMode,
  design: RestaurantDesign,
  advanced: Partial<AdvancedTheme>,
  fieldId: ThemeColorFieldId,
  advancedDefault: (key: keyof AdvancedTheme) => string
): string {
  if (mode === "basic") {
    return readBasicColor(design, fieldId as BasicColorField);
  }

  const key = fieldId as keyof AdvancedTheme;
  const stored = advanced[key];
  if (typeof stored === "string" && stored.trim()) {
    return normalizeHexColor(stored, advancedDefault(key));
  }
  return advancedDefault(key);
}

export function writeThemeColorPatch(
  mode: ThemeMode,
  fieldId: ThemeColorFieldId,
  value: string
): { design?: Partial<RestaurantDesign>; advanced?: Partial<AdvancedTheme> } {
  const normalized = normalizeHexColor(value, "#ffffff");

  if (mode === "basic") {
    return { design: writeBasicColorPatch(fieldId as BasicColorField, normalized) };
  }

  return { advanced: { [fieldId as keyof AdvancedTheme]: normalized } };
}

export function basicColorsFromDesign(design: RestaurantDesign): MenuThemeColors {
  return themeColorsFromDesign(design);
}

export const HOTSPOT_BASIC_POPOVER_FIELDS: Record<ThemeHotspotId, BasicColorField[]> = {
  header: ["headerNavBg"],
  categoryBar: ["categoryStripBackgroundColor", "categoryAccentColor"],
  menuItem: ["mainContentBackgroundColor"],
  carousel: ["headerNavBg"],
  footer: ["footerBackgroundColor"],
  filters: ["footerBackgroundColor"],
};

export function getHotspotPopoverFields(
  hotspot: ThemeHotspotId,
  mode: ThemeMode
): ThemePickerField[] | BasicColorField[] {
  return mode === "advanced"
    ? HOTSPOT_POPOVER_FIELDS[hotspot]
    : HOTSPOT_BASIC_POPOVER_FIELDS[hotspot];
}

export { HOTSPOT_POPOVER_FIELDS };
