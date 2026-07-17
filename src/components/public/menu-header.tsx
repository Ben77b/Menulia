"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { contrastingTextColor } from "@/lib/contrast";
import { usePreviewCanvas } from "@/contexts/preview-canvas-context";
import { pv } from "@/lib/preview-theme-vars";
import type { RestaurantLink } from "@/lib/restaurant-links";
import { menuUiString, type PublicMenuLocale } from "@/lib/public-menu-i18n";
import { RestaurantLogo } from "@/components/restaurant-logo";
import { normalizeImageUrl } from "@/lib/public-menu-utils";
import { MenuLanguageSelector } from "./menu-language-selector";
import { resolveLocalizedText, type LocalizedTextValue } from "@/lib/localized-text";

interface MenuHeaderProps {
  restaurantName: LocalizedTextValue;
  logo: string | null;
  headerBackgroundColor: string;
  headerTextColor?: string;
  titleFont: string;
  titleFontWeight?: number;
  titleFontStyle?: "normal" | "italic";
  links: RestaurantLink[];
  lang: PublicMenuLocale;
  onLangChange: (lang: PublicMenuLocale) => void;
  primaryLocale?: PublicMenuLocale;
  availableLocales?: string[];
  showLanguageSelector?: boolean;
}

export function MenuHeader({
  restaurantName,
  logo,
  headerBackgroundColor,
  headerTextColor,
  titleFont,
  titleFontWeight,
  titleFontStyle,
  links,
  lang,
  onLangChange,
  primaryLocale,
  availableLocales,
  showLanguageSelector = false,
}: MenuHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isPreview = usePreviewCanvas();
  const textColor = isPreview
    ? headerTextColor ?? pv("headerText")
    : headerTextColor ?? contrastingTextColor(headerBackgroundColor);
  const safeLinks = (links ?? []).filter(
    (link) => link && typeof link.url === "string" && link.url.trim() && link.label
  );
  const hasLinks = safeLinks.length > 0;
  const hasLogo = Boolean(normalizeImageUrl(logo));
  const localizedRestaurantName = resolveLocalizedText(
    restaurantName,
    lang,
    primaryLocale ?? "en"
  );

  return (
    <>
      <header
        className="sticky top-0 z-50 px-4 py-4"
        style={{ backgroundColor: headerBackgroundColor, color: textColor }}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-3 items-center gap-2 sm:gap-3">
          <div className="flex justify-start">
            {hasLinks ? (
              <button
                type="button"
                aria-label="Open menu links"
                onClick={() => setSidebarOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-full transition-opacity hover:opacity-80"
                style={{ color: textColor }}
              >
                <Menu className="h-6 w-6" style={{ color: textColor }} />
              </button>
            ) : (
              <span className="h-10 w-10" aria-hidden />
            )}
          </div>

          <div className="flex min-w-0 items-center justify-center px-2 text-center">
            <h1
              className={
                hasLogo
                  ? "sr-only"
                  : "text-center text-lg font-bold uppercase tracking-[0.2em] sm:text-xl"
              }
              style={
                hasLogo
                  ? undefined
                  : {
                      fontFamily: titleFont,
                      fontWeight: titleFontWeight ?? 400,
                      fontStyle: titleFontStyle ?? "normal",
                      color: textColor,
                    }
              }
            >
              {localizedRestaurantName}
            </h1>
            {hasLogo ? (
              <RestaurantLogo
                src={logo}
                alt={`${localizedRestaurantName} logo`}
                fallbackText={localizedRestaurantName}
                wrapperClassName="mx-auto h-16 w-40 sm:h-20 sm:w-48"
                className="h-full w-full"
                priority
              />
            ) : null}
          </div>

          <div className="flex justify-end">
            {showLanguageSelector ? (
              <MenuLanguageSelector
                lang={lang}
                onLangChange={onLangChange}
                primaryLocale={primaryLocale}
                availableLocales={availableLocales}
                headerBackgroundColor={headerBackgroundColor}
              />
            ) : (
              <span className="h-11 w-11" aria-hidden />
            )}
          </div>
        </div>
      </header>

      {hasLinks && (
        <>
          <div
            className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 ${
              sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className={`fixed left-0 top-0 z-[70] flex h-full w-72 max-w-[85vw] flex-col shadow-2xl transition-transform duration-300 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            style={{ backgroundColor: headerBackgroundColor, color: textColor }}
          >
            <div
              className="flex items-center justify-between border-b px-5 py-4"
              style={{ borderColor: textColor, color: textColor }}
            >
              <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: textColor }}>
                {menuUiString(lang, "links")}
              </p>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setSidebarOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:opacity-80"
                style={{ color: textColor }}
              >
                <X className="h-5 w-5" style={{ color: textColor }} />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-4">
              {(safeLinks ?? []).map((link, index) => (
                <a
                  key={link.id || `link-${index}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-4 py-3 text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ color: textColor, fontFamily: titleFont }}
                  onClick={() => setSidebarOpen(false)}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </aside>
        </>
      )}
    </>
  );
}
