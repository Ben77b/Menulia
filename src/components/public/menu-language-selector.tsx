"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Globe } from "lucide-react";
import { contrastingTextColor } from "@/lib/contrast";
import { HEADER_LANGUAGES, menuUiString, type PublicMenuLocale } from "@/lib/public-menu-i18n";

interface MenuLanguageSelectorProps {
  locale: PublicMenuLocale;
  onLocaleChange: (locale: PublicMenuLocale) => void;
  headerBackgroundColor: string;
}

export function MenuLanguageSelector({
  locale,
  onLocaleChange,
  headerBackgroundColor,
}: MenuLanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textColor = contrastingTextColor(headerBackgroundColor);
  const current = HEADER_LANGUAGES.find((lang) => lang.code === locale) ?? HEADER_LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={menuUiString(locale, "language")}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 items-center gap-1 rounded-full px-2 transition-opacity hover:opacity-80 sm:gap-1.5 sm:px-3"
        style={{ color: textColor }}
      >
        <Globe className="h-4 w-4 shrink-0" style={{ color: textColor }} />
        <span className="hidden text-xs font-medium sm:inline">{current.flag}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-80" style={{ color: textColor }} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-[80] mt-2 max-h-72 w-48 overflow-y-auto rounded-xl border border-black/10 py-1 shadow-xl"
          style={{ backgroundColor: headerBackgroundColor, color: textColor }}
        >
          {HEADER_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                onLocaleChange(lang.code);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-opacity hover:opacity-80"
              style={{
                color: textColor,
                fontWeight: lang.code === locale ? 600 : 400,
              }}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
