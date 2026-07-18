import type { MenuContentLanguage } from "@/lib/menu-content-languages";
import { WEEKDAY_ABBR, type WeekdayAbbr } from "@/lib/hours-schedule";

const WEEKDAY_LABELS: Record<MenuContentLanguage, Record<WeekdayAbbr, string>> = {
  en: { Mon: "Mon", Tue: "Tue", Wed: "Wed", Thu: "Thu", Fri: "Fri", Sat: "Sat", Sun: "Sun" },
  es: { Mon: "Lun", Tue: "Mar", Wed: "Mié", Thu: "Jue", Fri: "Vie", Sat: "Sáb", Sun: "Dom" },
  fr: { Mon: "Lun", Tue: "Mar", Wed: "Mer", Thu: "Jeu", Fri: "Ven", Sat: "Sam", Sun: "Dim" },
  de: { Mon: "Mo", Tue: "Di", Wed: "Mi", Thu: "Do", Fri: "Fr", Sat: "Sa", Sun: "So" },
};

/** Replace English weekday abbreviations in a compiled hours line for the guest locale. */
export function localizeHoursDisplay(
  hours: string,
  locale: MenuContentLanguage
): string {
  const trimmed = hours.trim();
  if (!trimmed) return "";

  const labels = WEEKDAY_LABELS[locale] ?? WEEKDAY_LABELS.en;
  let result = trimmed;

  for (const day of WEEKDAY_ABBR) {
    result = result.replace(new RegExp(`\\b${day}\\b`, "g"), labels[day]);
  }

  return result;
}
