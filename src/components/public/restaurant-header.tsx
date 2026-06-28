"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, ExternalLink, ChevronDown } from "lucide-react";
import { LANGUAGES, type LanguageCode } from "@/lib/languages";
import type { CustomLink } from "@/lib/types";
import type { RestaurantDesign } from "@/lib/restaurant-design";
import { cn } from "@/lib/utils";

interface RestaurantHeaderProps {
  name: string;
  logoUrl: string | null;
  customLinks: CustomLink[];
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  design: RestaurantDesign;
  restaurantId: string;
}

export function RestaurantHeader({
  name,
  logoUrl,
  customLinks,
  language,
  onLanguageChange,
  design,
  restaurantId,
}: RestaurantHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [visibleLanguages, setVisibleLanguages] = useState<Set<LanguageCode>>(new Set(["en"]));

  useEffect(() => {
    // Load visible languages from localStorage
    const saved = localStorage.getItem(`visible-languages-${restaurantId}`);
    if (saved) {
      setVisibleLanguages(new Set(JSON.parse(saved)));
    }
  }, [restaurantId]);

  const links = customLinks.map((l) => ({ label: l.label, url: l.url, icon: ExternalLink }));

  const currentLang = LANGUAGES.find((l) => l.code === language)!;
  const availableLanguages = LANGUAGES.filter((l) => visibleLanguages.has(l.code));

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex shrink-0 items-center px-4 py-3" style={{ backgroundColor: design.headerFooterBackgroundColor }}>
      {/* Custom links dropdown on the left */}
      <div className="relative w-10 flex-shrink-0 flex justify-start">
        <button
          onClick={() => { setMenuOpen(!menuOpen); setLangOpen(false); }}
          className="flex h-10 w-10 flex-col items-center justify-center gap-1 rounded-full bg-white/95 shadow-sm"
          aria-label="Open links menu"
        >
          {menuOpen ? (
            <X className="h-5 w-5" style={{ color: design.buttonColor }} />
          ) : (
            <>
              <span className="block h-0.5 w-5 rounded-full" style={{ backgroundColor: design.buttonColor }} />
              <span className="block h-0.5 w-5 rounded-full" style={{ backgroundColor: design.buttonColor }} />
              <span className="block h-0.5 w-5 rounded-full" style={{ backgroundColor: design.buttonColor }} />
            </>
          )}
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setMenuOpen(false)} />
            <nav className="absolute left-0 top-12 z-50 min-w-[220px] rounded-2xl border border-border bg-white p-2 shadow-xl">
              {links.length === 0 ? (
                <p className="px-3 py-2 text-sm text-text-secondary">No links added yet</p>
              ) : (
                links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-muted"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4" style={{ color: design.buttonColor }} />
                      {link.label}
                    </a>
                  );
                })
              )}
            </nav>
          </>
        )}
      </div>

      {/* Logo centered */}
      <div className="flex-1 flex justify-center">
        <div className="relative h-20 w-20 overflow-hidden">
          {logoUrl ? (
            <Image src={logoUrl} alt={name} fill className="object-contain" sizes="80px" />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center rounded-full text-lg font-bold text-white"
              style={{ backgroundColor: design.buttonColor }}
            >
              {name.charAt(0)}
            </div>
          )}
        </div>
      </div>

      {/* Language dropdown on the right */}
      <div className="relative w-10 flex-shrink-0 flex justify-end">
        <button
          onClick={() => { setLangOpen(!langOpen); setMenuOpen(false); }}
          className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-2 text-xs font-medium shadow-sm"
          aria-label="Change language"
        >
          <span>{currentLang.flag}</span>
          <span>{currentLang.code.toUpperCase()}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
        {langOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
            <div className="absolute right-0 top-12 z-50 max-h-64 min-w-[160px] overflow-y-auto rounded-2xl border border-border bg-white p-1 shadow-xl">
              {availableLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { onLanguageChange(lang.code); setLangOpen(false); }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-muted",
                    language === lang.code && "font-medium"
                  )}
                  style={
                    language === lang.code
                      ? { backgroundColor: `${design.buttonColor}18`, color: design.buttonColor }
                      : undefined
                  }
                >
                  <span>{lang.flag}</span>
                  {lang.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
