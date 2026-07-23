/**
 * Localized text unpacker + HTML entity sanitizer.
 * Must never throw — public menu rendering depends on this.
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

function toStringValue(entry: unknown): string {
  if (typeof entry === "string") return entry;
  if (typeof entry === "number" && Number.isFinite(entry)) return String(entry);
  if (typeof entry === "boolean") return entry ? "true" : "false";
  return "";
}

function coerceRecordStrings(value: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry == null) continue;
    const asString = toStringValue(entry);
    if (asString) out[key] = asString;
  }
  return out;
}

/** Decode common HTML entities (named + numeric) into plain text. */
export function decodeHtmlEntities(input: string): string {
  try {
    if (!input || typeof input !== "string" || !input.includes("&")) {
      return typeof input === "string" ? input : "";
    }

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
  } catch {
    return typeof input === "string" ? input : "";
  }
}

function firstNonEmptyValue(record: Record<string, string>): string {
  for (const value of Object.values(record)) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

/**
 * Unpack localized JSON / objects into a clean human-readable string.
 * Fallback order: targetLang → fallbackLang → en → first available value.
 * NEVER throws.
 */
export function getLocalizedText(
  input: LocalizedTextInput,
  targetLang: string = "en",
  fallbackLang: string = "en"
): string {
  try {
    if (input == null) return "";
    if (typeof input === "number" || typeof input === "boolean") {
      return String(input);
    }
    if (typeof input !== "string" && !isPlainObject(input)) {
      return "";
    }

    let record: Record<string, string> | null = null;
    let raw = "";

    if (typeof input === "string") {
      const trimmed = input.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed) as unknown;
          if (isPlainObject(parsed)) {
            const coerced = coerceRecordStrings(parsed);
            record = Object.keys(coerced).length > 0 ? coerced : null;
            if (!record) raw = input;
          } else {
            raw = input;
          }
        } catch {
          raw = input;
        }
      } else {
        raw = input;
      }
    } else if (isPlainObject(input)) {
      const coerced = coerceRecordStrings(input);
      record = Object.keys(coerced).length > 0 ? coerced : null;
    }

    if (record) {
      const target = (record[targetLang] || "").trim();
      if (target) return decodeHtmlEntities(target);
      const fallback = (record[fallbackLang] || "").trim();
      if (fallback) return decodeHtmlEntities(fallback);
      const english = (record.en || "").trim();
      if (english) return decodeHtmlEntities(english);
      raw = firstNonEmptyValue(record);
    }

    return decodeHtmlEntities(raw || "").trim();
  } catch {
    try {
      if (typeof input === "string") return input;
      return "";
    } catch {
      return "";
    }
  }
}

/** Truncate SEO copy without cutting mid-word when possible. */
export function truncateSeoText(input: string, maxLength = 160): string {
  try {
    const cleaned = getLocalizedText(input).replace(/\s+/g, " ").trim();
    if (cleaned.length <= maxLength) return cleaned;
    const slice = cleaned.slice(0, Math.max(0, maxLength - 1));
    const lastSpace = slice.lastIndexOf(" ");
    const base = lastSpace > maxLength * 0.6 ? slice.slice(0, lastSpace) : slice;
    return `${base.trimEnd()}…`;
  } catch {
    return "";
  }
}
