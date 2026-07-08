"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { contrastingTextColor } from "@/lib/contrast";
import { PUBLIC_MENU_LANGUAGES, type PublicMenuLocale } from "@/lib/public-menu-i18n";
import { cn } from "@/lib/utils";

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
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const textColor = contrastingTextColor(headerBackgroundColor);
  const currentLanguage =
    PUBLIC_MENU_LANGUAGES.find((language) => language.code === lang) ??
    PUBLIC_MENU_LANGUAGES[0];

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
        aria-label="Change menu language"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold tracking-wide backdrop-blur-sm transition-opacity hover:opacity-90 sm:text-xs"
        style={{
          borderColor: `${textColor}66`,
          backgroundColor: `${textColor}22`,
          color: textColor,
        }}
      >
        <span>
          {currentLanguage.flag} {currentLanguage.code.toUpperCase()}
        </span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Menu languages"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[9.5rem] overflow-hidden rounded-2xl border shadow-xl"
          style={{
            borderColor: `${textColor}33`,
            backgroundColor: contrastingTextColor(textColor),
            color: textColor,
          }}
        >
          {PUBLIC_MENU_LANGUAGES.map((language) => {
            const isActive = language.code === lang;

            return (
              <button
                key={language.code}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => selectLanguage(language.code)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors",
                  isActive ? "font-semibold" : "hover:opacity-80"
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: `${textColor}18`,
                      }
                    : undefined
                }
              >
                <span>{language.flag}</span>
                <span>{language.label}</span>
                <span className="ml-auto text-[11px] uppercase tracking-wide opacity-70">
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
