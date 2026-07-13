"use client";

import Link from "next/link";
import {
  menuUiString,
  normalizePublicMenuLocale,
  type PublicMenuLocale,
} from "@/lib/public-menu-i18n";

interface PublicMenuLegalDisclaimerProps {
  locale: PublicMenuLocale;
  textColor: string;
  bodyFont: string;
  bodyFontWeight?: number;
  bodyFontStyle?: "normal" | "italic";
}

function resolveDisclaimerHref(locale: PublicMenuLocale | undefined | null): string {
  try {
    const lang = normalizePublicMenuLocale(locale);
    return `/legal/disclaimer?lang=${lang}`;
  } catch {
    return "/legal/disclaimer?lang=en";
  }
}

export function PublicMenuLegalDisclaimer({
  locale,
  textColor,
  bodyFont,
  bodyFontWeight,
  bodyFontStyle,
}: PublicMenuLegalDisclaimerProps) {
  const href = resolveDisclaimerHref(locale);
  const label = menuUiString(locale ?? "en", "disclaimerLink");

  return (
    <Link
      href={href}
      className="mt-8 inline-flex min-h-11 w-full max-w-xl items-center justify-center px-4 py-3 text-center text-[11px] leading-snug opacity-75 underline-offset-4 transition-opacity hover:opacity-100 hover:underline sm:text-xs"
      style={{
        color: textColor,
        fontFamily: bodyFont,
        fontWeight: bodyFontWeight ?? 400,
        fontStyle: bodyFontStyle ?? "normal",
      }}
    >
      {label}
    </Link>
  );
}
