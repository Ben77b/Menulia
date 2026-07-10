"use client";

import type { PublicMenuLocale } from "@/lib/public-menu-i18n";

const DISCLAIMER: Record<PublicMenuLocale, string> = {
  es: "Nota legal: La información sobre alérgenos es proporcionada de forma exclusiva por el establecimiento. Menulia actúa únicamente como plataforma técnica de visualización y no se responsabiliza de la exactitud de los datos. En caso de duda, consulte con el personal.",
  en: "Legal notice: Allergen information is provided exclusively by the establishment. Menulia acts solely as a technical display platform and is not responsible for data accuracy. In case of doubt, always consult with staff.",
};

interface PublicMenuLegalDisclaimerProps {
  locale: PublicMenuLocale;
  textColor: string;
  bodyFont: string;
  bodyFontWeight?: number;
  bodyFontStyle?: "normal" | "italic";
}

export function PublicMenuLegalDisclaimer({
  locale,
  textColor,
  bodyFont,
  bodyFontWeight,
  bodyFontStyle,
}: PublicMenuLegalDisclaimerProps) {
  const primary = DISCLAIMER[locale];
  const secondary = DISCLAIMER[locale === "es" ? "en" : "es"];

  return (
    <div
      className="mt-8 w-full max-w-2xl border-t border-black/10 pt-6"
      style={{ color: textColor, textAlign: "center" }}
    >
      <p
        className="text-[11px] leading-relaxed opacity-80"
        style={{
          fontFamily: bodyFont,
          fontWeight: bodyFontWeight ?? 400,
          fontStyle: bodyFontStyle ?? "normal",
        }}
      >
        {primary}
      </p>
      <p
        className="mt-2 text-[11px] leading-relaxed opacity-65"
        style={{
          fontFamily: bodyFont,
          fontWeight: bodyFontWeight ?? 400,
          fontStyle: bodyFontStyle ?? "normal",
        }}
      >
        {secondary}
      </p>
    </div>
  );
}
