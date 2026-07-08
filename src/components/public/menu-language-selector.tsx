"use client";

import type { PublicMenuLocale } from "@/lib/public-menu-i18n";
import { contrastingTextColor } from "@/lib/contrast";

interface MenuLanguageSelectorProps {
  lang: PublicMenuLocale;
  onLangChange: (lang: PublicMenuLocale) => void;
  headerBackgroundColor?: string;
}

export function MenuLanguageSelector({
  lang,
  onLangChange,
  headerBackgroundColor = "#111827",
}: MenuLanguageSelectorProps) {
  const isEnglish = lang !== "es";
  const textColor = contrastingTextColor(headerBackgroundColor);
  const inactiveColor = `${textColor}CC`;

  return (
    <div
      className="inline-flex items-center rounded-full border p-1 text-[11px] font-semibold tracking-wide backdrop-blur-sm sm:text-xs"
      style={{
        borderColor: `${textColor}66`,
        backgroundColor: `${textColor}22`,
        color: textColor,
      }}
    >
      <button
        type="button"
        aria-label="Switch language to English"
        onClick={() => onLangChange("en")}
        className="rounded-full px-2.5 py-1 transition-colors"
        style={
          isEnglish
            ? { backgroundColor: textColor, color: contrastingTextColor(textColor) }
            : { color: inactiveColor }
        }
      >
        🇬🇧 EN
      </button>
      <button
        type="button"
        aria-label="Switch language to Spanish"
        onClick={() => onLangChange("es")}
        className="rounded-full px-2.5 py-1 transition-colors"
        style={
          !isEnglish
            ? { backgroundColor: textColor, color: contrastingTextColor(textColor) }
            : { color: inactiveColor }
        }
      >
        🇪🇸 ES
      </button>
    </div>
  );
}
