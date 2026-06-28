"use client";

import Image from "next/image";
import { contrastingTextColor } from "@/lib/contrast";
import type { MenuThemeColors } from "@/lib/theme-colors";
import { CategoryNav } from "./category-nav";
import { DishCarousel } from "./dish-carousel";
import { DishCard, type PublicMenuDish } from "./dish-card";

export interface PublicMenuCategory {
  id: string;
  name: string;
  layout_type: "carousel" | "stacked";
  dishes: PublicMenuDish[];
}

interface PublicMenuLayoutProps {
  restaurantName: string;
  logo: string | null;
  location: string;
  hours: string;
  contactInfo: string;
  theme: MenuThemeColors;
  titleFont: string;
  bodyFont: string;
  categories: PublicMenuCategory[];
}

export function PublicMenuLayout({
  restaurantName,
  logo,
  location,
  hours,
  contactInfo,
  theme,
  titleFont,
  bodyFont,
  categories,
}: PublicMenuLayoutProps) {
  const headerTextColor = contrastingTextColor(theme.headerBackgroundColor);
  const mainTextColor = contrastingTextColor(theme.mainContentBackgroundColor);
  const footerTextColor = contrastingTextColor(theme.footerBackgroundColor);
  const sectionTitleColor = mainTextColor;

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: theme.mainContentBackgroundColor, fontFamily: bodyFont }}
    >
      <header
        className="sticky top-0 z-50 border-b border-black/5 px-4 py-4 text-center"
        style={{ backgroundColor: theme.headerBackgroundColor, color: headerTextColor }}
      >
        {logo ? (
          <div className="relative mx-auto h-20 w-20">
            <Image src={logo} alt={restaurantName} fill className="object-contain" sizes="80px" />
          </div>
        ) : (
          <h1 className="text-xl font-bold" style={{ fontFamily: titleFont }}>
            {restaurantName}
          </h1>
        )}
      </header>

      <CategoryNav
        categories={categories.map((category) => ({ id: category.id, name: category.name }))}
        stripBackgroundColor={theme.categoryStripBackgroundColor}
        accentColor={theme.categoryAccentColor}
      />

      <main className="flex-1 px-4 py-8 sm:px-6">
        {categories.length === 0 ? (
          <div className="py-16 text-center" style={{ color: mainTextColor }}>
            <p className="text-lg font-semibold" style={{ fontFamily: titleFont }}>
              Menu coming soon!
            </p>
            <p className="mt-2 text-sm opacity-80">This restaurant hasn&apos;t added any dishes yet.</p>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-14">
            {categories.map((category) => (
              <section
                key={category.id}
                id={`category-${category.id}`}
                className="scroll-mt-36"
              >
                <h2
                  className="mb-6 text-2xl font-bold tracking-tight"
                  style={{ color: sectionTitleColor, fontFamily: titleFont }}
                >
                  {category.name}
                </h2>

                {category.layout_type === "carousel" ? (
                  <DishCarousel
                    dishes={category.dishes}
                    accentColor={theme.categoryAccentColor}
                    mainTextColor={mainTextColor}
                    titleFont={titleFont}
                    bodyFont={bodyFont}
                  />
                ) : (
                  <div className="space-y-10">
                    {category.dishes.map((dish) => (
                      <DishCard
                        key={dish.id}
                        dish={dish}
                        titleFont={titleFont}
                        bodyFont={bodyFont}
                        textColor={mainTextColor}
                        accentColor={theme.categoryAccentColor}
                        imageClassName="w-full max-w-sm"
                      />
                    ))}
                    {category.dishes.length === 0 && (
                      <p className="text-sm opacity-70" style={{ color: mainTextColor }}>
                        No dishes in this category.
                      </p>
                    )}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </main>

      {(location || hours || contactInfo) && (
        <footer
          className="border-t border-black/5 px-6 py-10"
          style={{ backgroundColor: theme.footerBackgroundColor, color: footerTextColor }}
        >
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
            {location && (
              <div className="text-center">
                <h3 className="mb-2 font-bold" style={{ fontFamily: titleFont }}>
                  Location
                </h3>
                <p className="text-sm leading-relaxed">{location}</p>
              </div>
            )}
            {hours && (
              <div className="text-center">
                <h3 className="mb-2 font-bold" style={{ fontFamily: titleFont }}>
                  Hours
                </h3>
                <p className="whitespace-pre-line text-sm leading-relaxed">{hours}</p>
              </div>
            )}
            {contactInfo && (
              <div className="text-center">
                <h3 className="mb-2 font-bold" style={{ fontFamily: titleFont }}>
                  Contact
                </h3>
                <p className="text-sm leading-relaxed">{contactInfo}</p>
              </div>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
