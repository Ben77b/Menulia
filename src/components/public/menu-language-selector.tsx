"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Languages } from "lucide-react";
import { contrastingTextColor } from "@/lib/contrast";
import {
  PUBLIC_MENU_LANGUAGES,
  isPublicMenuLocale,
  type PublicMenuLocale,
} from "@/lib/public-menu-i18n";
import { cn } from "@/lib/utils";

interface MenuLanguageSelectorProps {
  lang: PublicMenuLocale;
  onLangChange: (lang: PublicMenuLocale) => void;
  primaryLocale?: PublicMenuLocale;
  availableLocales?: string[];
  headerBackgroundColor?: string;
}

export function MenuLanguageSelector({
  lang,
  onLangChange,
  primaryLocale,
  availableLocales,
  headerBackgroundColor = "#111827",
}: MenuLanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const textColor = contrastingTextColor(headerBackgroundColor);
  const panelBackground = contrastingTextColor(textColor);

  const availableLanguages = useMemo(() => {
    // Prefer the full Mallorca tourist roster when provided; otherwise fall back to all.
    const localeSet = new Set(
      (availableLocales ?? PUBLIC_MENU_LANGUAGES.map((entry) => entry.code)).filter(
        isPublicMenuLocale
      )
    );
    if (primaryLocale && isPublicMenuLocale(primaryLocale)) {
      localeSet.add(primaryLocale);
    }

    const matched = PUBLIC_MENU_LANGUAGES.filter((language) => localeSet.has(language.code));
    return matched.length > 0 ? matched : PUBLIC_MENU_LANGUAGES;
  }, [availableLocales, primaryLocale]);

  const currentLanguage =
    availableLanguages.find((language) => language.code === lang) ?? availableLanguages[0];

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function selectLanguage(nextLang: PublicMenuLocale) {
    onLangChange(nextLang);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={`Change menu language (${currentLanguage.label})`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex min-h-11 min-w-[3.5rem] items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-sm font-semibold shadow-sm backdrop-blur-sm transition-transform active:scale-[0.98] hover:opacity-95"
        style={{
          borderColor: `${textColor}55`,
          backgroundColor: `${textColor}14`,
          color: textColor,
        }}
      >
        <Languages className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
        <span className="text-base leading-none" aria-hidden>
          {currentLanguage.flag}
        </span>
        <span className="hidden min-[380px]:inline tracking-wide">
          {currentLanguage.code.toUpperCase()}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Menu languages"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 max-h-[min(70vh,22rem)] min-w-[12rem] overflow-y-auto rounded-2xl border p-1.5 shadow-xl"
          style={{
            borderColor: `${textColor}28`,
            backgroundColor: panelBackground,
            color: contrastingTextColor(panelBackground),
          }}
        >
          {availableLanguages.map((language) => {
            const isActive = language.code === lang;

            return (
              <button
                key={language.code}
                type="button"
                role="option"
                aria-label={language.label}
                aria-selected={isActive}
                onClick={() => selectLanguage(language.code)}
                className={cn(
                  "flex w-full min-h-11 items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors",
                  isActive ? "opacity-100" : "opacity-80 hover:opacity-100"
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: `${contrastingTextColor(panelBackground)}14`,
                        color: contrastingTextColor(panelBackground),
                      }
                    : { color: contrastingTextColor(panelBackground) }
                }
              >
                <span className="text-lg leading-none">{language.flag}</span>
                <span className="flex-1">{language.label}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide opacity-50">
                  {language.code}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
