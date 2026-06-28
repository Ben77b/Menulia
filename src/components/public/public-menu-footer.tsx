"use client";

import { contrastingTextColor } from "@/lib/contrast";
import { menuUiString, type PublicMenuLocale } from "@/lib/public-menu-i18n";
import { RestaurantLogo } from "@/components/restaurant-logo";

interface PublicMenuFooterProps {
  restaurantName: string;
  logo: string | null;
  location: string;
  hours: string;
  contactPhone: string;
  contactEmail: string;
  footerSlogan: string;
  footerBackgroundColor: string;
  footerTextColor?: string;
  titleFont: string;
  bodyFont: string;
  locale: PublicMenuLocale;
}

export function PublicMenuFooter({
  restaurantName,
  logo,
  location,
  hours,
  contactPhone,
  contactEmail,
  footerSlogan,
  footerBackgroundColor,
  footerTextColor,
  titleFont,
  bodyFont,
  locale,
}: PublicMenuFooterProps) {
  const footerText = footerTextColor ?? contrastingTextColor(footerBackgroundColor);

  return (
    <footer
      className="border-t border-black/5 px-6 py-12"
      style={{ backgroundColor: footerBackgroundColor, color: footerText }}
    >
      <div
        className="mx-auto flex w-full max-w-2xl flex-col items-center text-center"
        style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}
      >
        {/* 1. Logo */}
        {logo ? (
          <RestaurantLogo
            src={logo}
            alt={restaurantName}
            wrapperClassName="mx-auto h-16 w-40"
            className="h-16 w-full"
          />
        ) : (
          <p
            className="text-2xl font-bold uppercase tracking-[0.25em]"
            style={{ fontFamily: titleFont, color: footerText, textAlign: "center" }}
          >
            {restaurantName}
          </p>
        )}

        {/* 2. Footer slogan — directly beneath logo */}
        {footerSlogan && (
          <p
            className="mt-4 max-w-xl text-sm italic leading-relaxed"
            style={{ color: footerText, fontFamily: bodyFont, textAlign: "center" }}
          >
            {footerSlogan}
          </p>
        )}

        {/* 3. Open hours */}
        {hours && (
          <div className="mt-10 w-full" style={{ color: footerText, textAlign: "center" }}>
            <h3
              className="mb-3 text-sm font-bold uppercase tracking-[0.2em]"
              style={{ fontFamily: titleFont, color: footerText, textAlign: "center" }}
            >
              {menuUiString(locale, "openHours")}
            </h3>
            <p
              className="whitespace-pre-line text-sm leading-relaxed"
              style={{ color: footerText, textAlign: "center" }}
            >
              {hours}
            </p>
          </div>
        )}

        {/* 4. Location & contact */}
        {(location || contactPhone || contactEmail) && (
          <div className="mt-8 w-full" style={{ color: footerText, textAlign: "center" }}>
            <h3
              className="mb-3 text-sm font-bold uppercase tracking-[0.2em]"
              style={{ fontFamily: titleFont, color: footerText, textAlign: "center" }}
            >
              {menuUiString(locale, "locationContact")}
            </h3>
            <div
              className="space-y-1 text-sm leading-relaxed"
              style={{ color: footerText, textAlign: "center" }}
            >
              {contactPhone && <p style={{ textAlign: "center" }}>{contactPhone}</p>}
              {contactEmail && <p style={{ textAlign: "center" }}>{contactEmail}</p>}
              {location && <p style={{ textAlign: "center" }}>{location}</p>}
            </div>
          </div>
        )}

        {/* 5. Powered by — bottom */}
        <p
          className="mt-10 text-xs uppercase tracking-[0.2em]"
          style={{ color: footerText, textAlign: "center" }}
        >
          {menuUiString(locale, "poweredBy")}
        </p>
      </div>
    </footer>
  );
}
