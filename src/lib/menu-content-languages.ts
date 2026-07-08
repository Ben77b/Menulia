export type MenuContentLanguage = "en" | "es";

export const MENU_CONTENT_LANGUAGES: {
  code: MenuContentLanguage;
  label: string;
  flag: string;
  deeplCode: string;
}[] = [
  { code: "en", label: "English", flag: "🇬🇧", deeplCode: "EN" },
  { code: "es", label: "Spanish", flag: "🇪🇸", deeplCode: "ES" },
];

export function getMenuContentLanguageMeta(code: MenuContentLanguage) {
  return MENU_CONTENT_LANGUAGES.find((language) => language.code === code) ?? MENU_CONTENT_LANGUAGES[0];
}

export function deeplCodeToMenuLanguage(code: string | undefined): MenuContentLanguage {
  const normalized = code?.trim().toUpperCase();
  if (normalized === "ES") return "es";
  return "en";
}
