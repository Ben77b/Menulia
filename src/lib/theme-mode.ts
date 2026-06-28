export type ThemeMode = "basic" | "advanced";

export const DEFAULT_THEME_MODE: ThemeMode = "basic";

export function parseThemeMode(raw: unknown): ThemeMode {
  if (raw === "advanced" || raw === true) return "advanced";
  return "basic";
}

export function serializeThemeMode(mode: ThemeMode): ThemeMode {
  return mode === "advanced" ? "advanced" : "basic";
}
