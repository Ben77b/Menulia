import type { CSSProperties } from "react";
import type { ResolvedMenuTheme } from "./advanced-theme";

/** CSS custom property names on `.menu-preview-canvas` */
export const PREVIEW_VAR = {
  menuBackground: "--preview-menu-bg",
  dividerLine: "--preview-divider",
  headerBg: "--preview-header-bg",
  headerText: "--preview-header-text",
  navBg: "--preview-nav-bg",
  tier1ActiveBg: "--preview-tier1-active-bg",
  tier1ActiveText: "--preview-tier1-active-text",
  tier1ActiveBorder: "--preview-tier1-active-border",
  tier1InactiveBg: "--preview-tier1-inactive-bg",
  tier1InactiveText: "--preview-tier1-inactive-text",
  tier1InactiveBorder: "--preview-tier1-inactive-border",
  activeTabBg: "--preview-active-tab-bg",
  activeTabText: "--preview-active-tab-text",
  activeTabBorder: "--preview-active-tab-border",
  inactiveTabBg: "--preview-inactive-tab-bg",
  inactiveTabText: "--preview-inactive-tab-text",
  inactiveTabBorder: "--preview-inactive-tab-border",
  itemTitle: "--preview-item-title",
  itemDescription: "--preview-item-description",
  itemPrice: "--preview-item-price",
  carouselArrowBg: "--preview-carousel-arrow-bg",
  carouselArrowIcon: "--preview-carousel-arrow-icon",
  carouselActiveDot: "--preview-carousel-active-dot",
  carouselInactiveDot: "--preview-carousel-inactive-dot",
  footerBg: "--preview-footer-bg",
  footerText: "--preview-footer-text",
  filterBg: "--preview-filter-bg",
  filterText: "--preview-filter-text",
  filterBorder: "--preview-filter-border",
} as const;

export type PreviewVarKey = keyof typeof PREVIEW_VAR;

/** Read a preview CSS variable (use inside `.menu-preview-canvas` only) */
export function pv(key: PreviewVarKey): string {
  return `var(${PREVIEW_VAR[key]})`;
}

export function resolvedThemeToPreviewCssProperties(
  theme: ResolvedMenuTheme
): CSSProperties {
  return {
    [PREVIEW_VAR.menuBackground]: theme.menuBackground,
    [PREVIEW_VAR.dividerLine]: theme.dividerLineColor,
    [PREVIEW_VAR.headerBg]: theme.logoAreaBg,
    [PREVIEW_VAR.headerText]: theme.logoAreaText,
    [PREVIEW_VAR.navBg]: theme.categoryBarBg,
    [PREVIEW_VAR.tier1ActiveBg]: theme.tier1ActiveBg,
    [PREVIEW_VAR.tier1ActiveText]: theme.tier1ActiveText,
    [PREVIEW_VAR.tier1ActiveBorder]: theme.tier1ActiveBorder,
    [PREVIEW_VAR.tier1InactiveBg]: theme.tier1InactiveBg,
    [PREVIEW_VAR.tier1InactiveText]: theme.tier1InactiveText,
    [PREVIEW_VAR.tier1InactiveBorder]: theme.tier1InactiveBorder,
    [PREVIEW_VAR.activeTabBg]: theme.tier2ActiveBg,
    [PREVIEW_VAR.activeTabText]: theme.tier2ActiveText,
    [PREVIEW_VAR.activeTabBorder]: theme.tier2ActiveBorder,
    [PREVIEW_VAR.inactiveTabBg]: theme.tier2InactiveBg,
    [PREVIEW_VAR.inactiveTabText]: theme.tier2InactiveText,
    [PREVIEW_VAR.inactiveTabBorder]: theme.tier2InactiveBorder,
    [PREVIEW_VAR.itemTitle]: theme.itemTitleText,
    [PREVIEW_VAR.itemDescription]: theme.itemDescriptionText,
    [PREVIEW_VAR.itemPrice]: theme.priceTextColor,
    [PREVIEW_VAR.carouselArrowBg]: theme.carouselArrowBg,
    [PREVIEW_VAR.carouselArrowIcon]: theme.carouselArrowIcon,
    [PREVIEW_VAR.carouselActiveDot]: theme.carouselActiveIndicator,
    [PREVIEW_VAR.carouselInactiveDot]: theme.carouselInactiveDots,
    [PREVIEW_VAR.footerBg]: theme.footerBackgroundColor,
    [PREVIEW_VAR.footerText]: theme.footerTextIcon,
    [PREVIEW_VAR.filterBg]: theme.filterAreaBg,
    [PREVIEW_VAR.filterText]: theme.filterText,
    [PREVIEW_VAR.filterBorder]: theme.filterBorder,
  } as CSSProperties;
}

/** Pick literal color or CSS var depending on preview canvas mode */
export function themedColor(
  usePreviewVars: boolean,
  varKey: PreviewVarKey,
  literal: string
): string {
  return usePreviewVars ? pv(varKey) : literal;
}
