"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
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
    const localeSet = new Set(
      (availableLocales ?? [])
        .filter(isPublicMenuLocale)
        .concat(primaryLocale && isPublicMenuLocale(primaryLocale) ? [primaryLocale] : [])
    );

    if (localeSet.size === 0) {
      return PUBLIC_MENU_LANGUAGES;
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
        className="inline-flex min-h-11 min-w-[3.25rem] items-center justify-center gap-1.5 rounded-full border-2 px-3 py-2 text-sm font-semibold shadow-md backdrop-blur-sm transition-transform active:scale-[0.98] hover:opacity-95"
        style={{
          borderColor: `${textColor}66`,
          backgroundColor: `${textColor}22`,
          color: textColor,
          boxShadow: `0 2px 12px ${textColor}22`,
        }}
      >
        <span className="text-xl leading-none" aria-hidden>
          {currentLanguage.flag}
        </span>
        <span className="hidden min-[380px]:inline tracking-wide">{currentLanguage.code.toUpperCase()}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Menu languages"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[9rem] rounded-2xl border p-1.5 shadow-xl"
          style={{
            borderColor: `${textColor}33`,
            backgroundColor: panelBackground,
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
                  "flex w-full min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors",
                  isActive ? "opacity-100" : "opacity-80 hover:opacity-100"
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: `${textColor}18`,
                        color: contrastingTextColor(panelBackground),
                      }
                    : { color: contrastingTextColor(panelBackground) }
                }
              >
                <span className="text-xl leading-none">{language.flag}</span>
                <span>{language.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
