"use client";

import Link from "next/link";
import type { PublicMenuLocale } from "@/lib/public-menu-i18n";

const LINK_LABEL =
  "Aviso de Alérgenos y Responsabilidad / Allergen & Liability Disclaimer";

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
  return (
    <Link
      href={`/legal/disclaimer?lang=${locale}`}
      className="mt-8 inline-flex min-h-11 w-full max-w-xl items-center justify-center px-4 py-3 text-center text-[11px] leading-snug opacity-75 underline-offset-4 transition-opacity hover:opacity-100 hover:underline sm:text-xs"
      style={{
        color: textColor,
        fontFamily: bodyFont,
        fontWeight: bodyFontWeight ?? 400,
        fontStyle: bodyFontStyle ?? "normal",
      }}
    >
      {LINK_LABEL}
    </Link>
  );
}
