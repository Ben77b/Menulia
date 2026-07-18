export type MenuContentLanguage =
  | "es"
  | "ca"
  | "en"
  | "de"
  | "fr"
  | "it"
  | "nl"
  | "sv"
  | "nb"
  | "da"
  | "pl"
  | "pt"
  | "ru"
  | "cs"
  | "fi";

export const DEFAULT_PRIMARY_LANGUAGE: MenuContentLanguage = "es";

/** Balearic / Mallorca tourist language roster for guest menus + DeepL */
export const MENU_CONTENT_LANGUAGES: {
  code: MenuContentLanguage;
  label: string;
  flag: string;
  deeplCode: string;
}[] = [
  { code: "es", label: "Spanish", flag: "🇪🇸", deeplCode: "ES" },
  { code: "ca", label: "Catalan", flag: "🇦🇩", deeplCode: "CA" },
  { code: "en", label: "English", flag: "🇬🇧", deeplCode: "EN" },
  { code: "de", label: "German", flag: "🇩🇪", deeplCode: "DE" },
  { code: "fr", label: "French", flag: "🇫🇷", deeplCode: "FR" },
  { code: "it", label: "Italian", flag: "🇮🇹", deeplCode: "IT" },
  { code: "nl", label: "Dutch", flag: "🇳🇱", deeplCode: "NL" },
  { code: "sv", label: "Swedish", flag: "🇸🇪", deeplCode: "SV" },
  { code: "nb", label: "Norwegian", flag: "🇳🇴", deeplCode: "NB" },
  { code: "da", label: "Danish", flag: "🇩🇰", deeplCode: "DA" },
  { code: "pl", label: "Polish", flag: "🇵🇱", deeplCode: "PL" },
  { code: "pt", label: "Portuguese", flag: "🇵🇹", deeplCode: "PT-PT" },
  { code: "ru", label: "Russian", flag: "🇷🇺", deeplCode: "RU" },
  { code: "cs", label: "Czech", flag: "🇨🇿", deeplCode: "CS" },
  { code: "fi", label: "Finnish", flag: "🇫🇮", deeplCode: "FI" },
];

const MENU_CONTENT_LANGUAGE_CODES = new Set<string>(
  MENU_CONTENT_LANGUAGES.map((language) => language.code)
);

export function isMenuContentLanguage(value: unknown): value is MenuContentLanguage {
  return typeof value === "string" && MENU_CONTENT_LANGUAGE_CODES.has(value);
}

export function getMenuContentLanguageMeta(code: MenuContentLanguage) {
  return MENU_CONTENT_LANGUAGES.find((language) => language.code === code) ?? MENU_CONTENT_LANGUAGES[0];
}

export function deeplCodeToMenuLanguage(code: string | undefined): MenuContentLanguage {
  const normalized = code?.trim().toUpperCase() ?? "";

  if (normalized === "ES" || normalized.startsWith("ES-")) return "es";
  if (normalized === "CA" || normalized.startsWith("CA-")) return "ca";
  if (normalized === "FR" || normalized.startsWith("FR-")) return "fr";
  if (normalized === "DE" || normalized.startsWith("DE-")) return "de";
  if (normalized === "IT" || normalized.startsWith("IT-")) return "it";
  if (normalized === "NL" || normalized.startsWith("NL-")) return "nl";
  if (normalized === "SV" || normalized.startsWith("SV-")) return "sv";
  if (normalized === "NB" || normalized.startsWith("NB-") || normalized === "NO") return "nb";
  if (normalized === "DA" || normalized.startsWith("DA-")) return "da";
  if (normalized === "PL" || normalized.startsWith("PL-")) return "pl";
  if (normalized === "PT" || normalized.startsWith("PT-")) return "pt";
  if (normalized === "RU" || normalized.startsWith("RU-")) return "ru";
  if (normalized === "CS" || normalized.startsWith("CS-")) return "cs";
  if (normalized === "FI" || normalized.startsWith("FI-")) return "fi";
  if (normalized === "EN" || normalized.startsWith("EN-")) return "en";

  return "en";
}

export function normalizePrimaryLanguage(value: unknown): MenuContentLanguage {
  return isMenuContentLanguage(value) ? value : DEFAULT_PRIMARY_LANGUAGE;
}

/** Map browser navigator.language to a supported guest menu locale. */
export function detectGuestMenuLanguage(
  navigatorLanguage: string | undefined | null
): MenuContentLanguage | null {
  const raw = (navigatorLanguage ?? "").trim().toLowerCase();
  if (!raw) return null;

  const primary = raw.split("-")[0] ?? raw;
  if (primary === "no") return "nb";
  if (isMenuContentLanguage(primary)) return primary;
  if (isMenuContentLanguage(raw)) return raw;
  return null;
}

/** Preferred inline-editor secondary when only one counterpart field is shown. */
export function getSecondaryLanguage(primary: MenuContentLanguage): MenuContentLanguage {
  if (primary === "en") return "es";
  return "en";
}

export function getTranslationTargetLanguages(
  primary: MenuContentLanguage
): MenuContentLanguage[] {
  return MENU_CONTENT_LANGUAGES.filter((language) => language.code !== primary).map(
    (language) => language.code
  );
}
