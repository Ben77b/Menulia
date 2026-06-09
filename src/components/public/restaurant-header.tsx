"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Instagram, Facebook, Globe, ExternalLink, ChevronDown } from "lucide-react";
import { LANGUAGES, type LanguageCode } from "@/lib/languages";
import type { CustomRestaurantLink } from "@/lib/types";
import type { RestaurantDesign } from "@/lib/restaurant-design";
import { cn } from "@/lib/utils";

interface RestaurantHeaderProps {
  name: string;
  logoUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  websiteUrl: string | null;
  customLinks: CustomRestaurantLink[];
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  design: RestaurantDesign;
}

export function RestaurantHeader({
  name,
  logoUrl,
  instagramUrl,
  facebookUrl,
  websiteUrl,
  customLinks,
  language,
  onLanguageChange,
  design,
}: RestaurantHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const links = [
    instagramUrl && { label: "Instagram", url: instagramUrl, icon: Instagram },
    facebookUrl && { label: "Facebook", url: facebookUrl, icon: Facebook },
    websiteUrl && { label: "Website", url: websiteUrl, icon: Globe },
    ...customLinks.map((l) => ({ label: l.label, url: l.url, icon: ExternalLink })),
  ].filter(Boolean) as { label: string; url: string; icon: typeof Instagram }[];

  const currentLang = LANGUAGES.find((l) => l.code === language)!;

  return (
    <header className="relative z-20 flex shrink-0 items-center justify-between px-4 py-3">
      {/* Burger menu */}
      <div className="relative">
        <button
          onClick={() => { setMenuOpen(!menuOpen); setLangOpen(false); }}
          className="flex h-10 w-10 flex-col items-center justify-center gap-1 rounded-full bg-white/95 shadow-sm"
          aria-label="Open menu"
        >
          {menuOpen ? (
            <X className="h-5 w-5" style={{ color: design.accentColor }} />
          ) : (
            <>
              <span className="block h-0.5 w-5 rounded-full" style={{ backgroundColor: design.accentColor }} />
              <span className="block h-0.5 w-5 rounded-full" style={{ backgroundColor: design.accentColor }} />
              <span className="block h-0.5 w-5 rounded-full" style={{ backgroundColor: design.accentColor }} />
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
                      <Icon className="h-4 w-4" style={{ color: design.accentColor }} />
                      {link.label}
                    </a>
                  );
                })
              )}
            </nav>
          </>
        )}
      </div>

      {/* Logo */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className={cn(
            "relative h-14 w-14 overflow-hidden rounded-full border-2 border-white shadow-md",
            design.headerStyle === "bold" && "h-16 w-16"
          )}
          style={
            design.headerStyle === "bold"
              ? { boxShadow: `0 0 0 3px white, 0 0 0 5px ${design.accentColor}` }
              : undefined
          }
        >
          {logoUrl ? (
            <Image src={logoUrl} alt={name} fill className="object-cover" sizes="64px" />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-lg font-bold text-white"
              style={{ backgroundColor: design.accentColor }}
            >
              {name.charAt(0)}
            </div>
          )}
        </div>
      </div>

      {/* Language */}
      <div className="relative">
        <button
          onClick={() => { setLangOpen(!langOpen); setMenuOpen(false); }}
          className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-2 text-xs font-medium shadow-sm"
        >
          <span>{currentLang.flag}</span>
          <span>{currentLang.code.toUpperCase()}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
        {langOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
            <div className="absolute right-0 top-12 z-50 max-h-64 min-w-[160px] overflow-y-auto rounded-2xl border border-border bg-white p-1 shadow-xl">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { onLanguageChange(lang.code); setLangOpen(false); }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-muted",
                    language === lang.code && "font-medium"
                  )}
                  style={
                    language === lang.code
                      ? { backgroundColor: `${design.accentColor}18`, color: design.accentColor }
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
