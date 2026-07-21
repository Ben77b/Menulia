/**
 * Localized text unpacker + HTML entity sanitizer.
 * Ensures stringified JSON locale maps and escaped entities never reach the DOM/SEO.
 */

export type LocalizedTextInput = unknown;

const HTML_ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&#39;": "'",
  "&#x27;": "'",
  "&#x2F;": "/",
  "&nbsp;": " ",
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  if (!isPlainObject(value)) return false;
  const entries = Object.values(value);
  if (entries.length === 0) return false;
  // Allow null/undefined values; require at least one string entry.
  return entries.every(
    (entry) => entry == null || typeof entry === "string" || typeof entry === "number"
  );
}

function coerceRecordStrings(value: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string") out[key] = entry;
    else if (typeof entry === "number" && Number.isFinite(entry)) out[key] = String(entry);
  }
  return out;
}

/** Decode common HTML entities (named + numeric) into plain text. */
export function decodeHtmlEntities(input: string): string {
  if (!input || !input.includes("&")) return input;

  let decoded = input.replace(
    /&(amp|lt|gt|quot|apos|nbsp);|&#(?:x27|x2F|39);/gi,
    (match) => HTML_ENTITY_MAP[match.toLowerCase()] ?? HTML_ENTITY_MAP[match] ?? match
  );

  decoded = decoded.replace(/&#(\d+);/g, (full, code: string) => {
    const n = Number(code);
    if (!Number.isFinite(n) || n < 0 || n > 0x10ffff) return full;
    try {
      return String.fromCodePoint(n);
    } catch {
      return full;
    }
  });
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (full, hex: string) => {
    const n = Number.parseInt(hex, 16);
    if (!Number.isFinite(n) || n < 0 || n > 0x10ffff) return full;
    try {
      return String.fromCodePoint(n);
    } catch {
      return full;
    }
  });

  return decoded;
}

function coerceToRecordOrString(input: LocalizedTextInput): string | Record<string, string> | null {
  if (input == null) return null;

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (isPlainObject(parsed) && isStringRecord(parsed)) {
          return coerceRecordStrings(parsed);
        }
      } catch {
        return input;
      }
    }
    return input;
  }

  if (isPlainObject(input) && isStringRecord(input)) {
    return coerceRecordStrings(input);
  }
  return null;
}

function firstNonEmptyValue(record: Record<string, string>): string {
  for (const value of Object.values(record)) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

/**
 * Unpack localized JSON / objects into a clean human-readable string.
 * Fallback order: targetLang → en → first available value.
 */
export function getLocalizedText(
  input: LocalizedTextInput,
  targetLang: string = "en",
  fallbackLang: string = "en"
): string {
  const coerced = coerceToRecordOrString(input);
  if (coerced == null) return "";

  let raw = "";
  if (typeof coerced === "string") {
    raw = coerced;
  } else {
    raw =
      (coerced[targetLang] || "").trim() ||
      (coerced[fallbackLang] || "").trim() ||
      (coerced.en || "").trim() ||
      firstNonEmptyValue(coerced);
  }

  return decodeHtmlEntities(raw).trim();
}

/** Truncate SEO copy without cutting mid-word when possible. */
export function truncateSeoText(input: string, maxLength = 160): string {
  const cleaned = decodeHtmlEntities(input).replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  const slice = cleaned.slice(0, maxLength - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const base = lastSpace > maxLength * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${base.trimEnd()}…`;
}
