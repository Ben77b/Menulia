import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { addMinutes, format, parse, isBefore } from "date-fns";
import type { OperatingHourData } from "./types";
import { LANGUAGE_CODES, type LanguageCode } from "./languages";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(price);
}

export function generateTimeSlots(
  hours: OperatingHourData[],
  date: Date,
  intervalMinutes = 30
): string[] {
  const dayName = format(date, "EEEE");
  const dayHours = hours.find((h) => h.day === dayName);

  if (!dayHours || !dayHours.isOpen || !dayHours.startTime || !dayHours.endTime) {
    return [];
  }

  const slots: string[] = [];
  const baseDate = format(date, "yyyy-MM-dd");
  let current = parse(`${baseDate} ${dayHours.startTime}`, "yyyy-MM-dd HH:mm", new Date());
  const close = parse(`${baseDate} ${dayHours.endTime}`, "yyyy-MM-dd HH:mm", new Date());

  while (isBefore(current, close)) {
    slots.push(format(current, "HH:mm"));
    current = addMinutes(current, intervalMinutes);
  }

  return slots;
}

export function detectBrowserLanguage(): LanguageCode {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language.split("-")[0].toLowerCase();
  return (LANGUAGE_CODES as readonly string[]).includes(lang)
    ? (lang as LanguageCode)
    : "en";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
