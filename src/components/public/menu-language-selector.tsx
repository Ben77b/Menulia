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
  const panelBackground = contrastingTextColor(textColor);
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
        aria-label={`Change menu language (${currentLanguage.label})`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-1 rounded-full border px-2 py-1.5 backdrop-blur-sm transition-opacity hover:opacity-90"
        style={{
          borderColor: `${textColor}44`,
          backgroundColor: `${textColor}18`,
          color: textColor,
        }}
      >
        <span className="text-lg leading-none">{currentLanguage.flag}</span>
        <ChevronDown
          className={cn("h-3 w-3 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Menu languages"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 flex flex-col gap-1 rounded-2xl border p-1.5 shadow-xl"
          style={{
            borderColor: `${textColor}33`,
            backgroundColor: panelBackground,
          }}
        >
          {PUBLIC_MENU_LANGUAGES.map((language) => {
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
                  "flex h-10 w-10 items-center justify-center rounded-xl text-xl transition-opacity",
                  isActive ? "opacity-100" : "opacity-80 hover:opacity-100"
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: `${textColor}18`,
                      }
                    : undefined
                }
              >
                {language.flag}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
