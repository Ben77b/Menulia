/**
 * Normalize common international price typing (12,50 / 12'50) to a decimal string.
 */
export function normalizePriceInputString(raw: string): string {
  return raw.trim().replace(/,/g, ".").replace(/'/g, ".");
}

/**
 * Parse a user-entered price into a number for database storage.
 * Accepts commas and apostrophes as decimal separators.
 */
export function parsePriceInput(raw: string): number {
  let normalized = normalizePriceInputString(raw);
  normalized = normalized.replace(/[^\d.]/g, "");

  if (!normalized) return 0;

  const dotCount = (normalized.match(/\./g) ?? []).length;
  if (dotCount > 1) {
    const lastDot = normalized.lastIndexOf(".");
    const whole = normalized.slice(0, lastDot).replace(/\./g, "");
    const fraction = normalized.slice(lastDot + 1);
    normalized = `${whole}.${fraction}`;
  }

  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}
