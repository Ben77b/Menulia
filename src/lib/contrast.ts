const BLACK = "#000000";
const WHITE = "#FFFFFF";

function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  return {
    r: parseInt(expanded.slice(0, 2), 16),
    g: parseInt(expanded.slice(2, 4), 16),
    b: parseInt(expanded.slice(4, 6), 16),
  };
}

function srgbChannelToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance: Y = 0.2126R + 0.7152G + 0.0722B (linear sRGB). */
export function relativeLuminance(hex: string): number {
  const rgb = parseHexColor(hex);
  if (!rgb) return 1;

  const r = srgbChannelToLinear(rgb.r);
  const g = srgbChannelToLinear(rgb.g);
  const b = srgbChannelToLinear(rgb.b);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(luminanceA: number, luminanceB: number): number {
  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Absolute black/white text for a background.
 * Light backgrounds (luminance > 0.5) → #000000, dark backgrounds → #FFFFFF.
 */
export function contrastingTextColor(backgroundHex: string): "#000000" | "#FFFFFF" {
  return relativeLuminance(backgroundHex) > 0.5 ? BLACK : WHITE;
}

/** Highest WCAG contrast ratio pick — used for accent-on-accent edge cases. */
export function highestContrastTextColor(backgroundHex: string): "#000000" | "#FFFFFF" {
  const backgroundLuminance = relativeLuminance(backgroundHex);
  const contrastWithBlack = contrastRatio(backgroundLuminance, 0);
  const contrastWithWhite = contrastRatio(backgroundLuminance, 1);
  return contrastWithWhite >= contrastWithBlack ? WHITE : BLACK;
}

export { BLACK, WHITE };
