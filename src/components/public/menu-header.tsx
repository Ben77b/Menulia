"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { contrastingTextColor } from "@/lib/contrast";
import type { RestaurantLink } from "@/lib/restaurant-links";
import { menuUiString, type PublicMenuLocale } from "@/lib/public-menu-i18n";
import { RestaurantLogo } from "@/components/restaurant-logo";
import { MenuLanguageSelector } from "./menu-language-selector";

interface MenuHeaderProps {
  restaurantName: string;
  logo: string | null;
  headerBackgroundColor: string;
  titleFont: string;
  links: RestaurantLink[];
  locale: PublicMenuLocale;
  onLocaleChange: (locale: PublicMenuLocale) => void;
}

export function MenuHeader({
  restaurantName,
  logo,
  headerBackgroundColor,
  titleFont,
  links,
  locale,
  onLocaleChange,
}: MenuHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const textColor = contrastingTextColor(headerBackgroundColor);
  const hasLinks = links.length > 0;

  return (
    <>
      <header
        className="sticky top-0 z-50 px-4 py-4"
        style={{ backgroundColor: headerBackgroundColor, color: textColor }}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-[2.5rem_1fr_2.5rem] items-center gap-3">
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
              <span className="h-10 w-10" />
            )}
          </div>

          <div className="flex justify-center">
            {logo ? (
              <RestaurantLogo
                src={logo}
                alt={restaurantName}
                wrapperClassName="h-16 w-40 sm:h-20 sm:w-48"
                className="h-full w-full"
              />
            ) : (
              <h1
                className="text-center text-lg font-bold uppercase tracking-[0.2em] sm:text-xl"
                style={{ fontFamily: titleFont, color: textColor }}
              >
                {restaurantName}
              </h1>
            )}
          </div>

          <div className="flex justify-end">
            <MenuLanguageSelector
              locale={locale}
              onLocaleChange={onLocaleChange}
              headerBackgroundColor={headerBackgroundColor}
            />
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
                {menuUiString(locale, "links")}
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
              {links.map((link) => (
                <a
                  key={link.id}
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
