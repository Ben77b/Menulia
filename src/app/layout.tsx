import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Cormorant_Garamond, Inter, Instrument_Serif, Montserrat, Playfair_Display, Poppins, Roboto, Open_Sans, Lato, Merriweather, Oswald, Raleway, Source_Sans_3, Ubuntu } from "next/font/google";
import "./globals.css";
import { RestaurantProvider } from "@/contexts/restaurant-context";

const cormorantGaramond = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-cormorant-garamond" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["italic"],
  variable: "--font-instrument-serif",
});
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-playfair-display",
});
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins" });
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-roboto" });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans" });
const lato = Lato({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-lato" });
const merriweather = Merriweather({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-merriweather" });
const oswald = Oswald({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-oswald" });
const raleway = Raleway({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-raleway" });
const sourceSans = Source_Sans_3({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-source-sans" });
const ubuntu = Ubuntu({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-ubuntu" });

export const metadata: Metadata = {
  title: {
    default: "menulia.net — Digital Menus & Reservations for Restaurants",
    template: "%s | menulia.net",
  },
  description:
    "Premium SaaS platform for restaurant owners to digitize menus, manage reservations, and delight diners with 28+ language interactive displays.",
  manifest: "/manifest.json",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.menulia.net"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "menulia.net",
    title: "menulia.net — Digital Menus for Restaurants",
    description: "Stunning multi-language digital menus, reservations, and analytics for modern restaurants.",
  },
  twitter: {
    card: "summary_large_image",
    title: "menulia.net",
    description: "Digital menus and reservations for modern restaurants.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const locale = headersList.get("x-locale") === "es" ? "es" : "en";

  return (
    <html lang={locale}>
      <body className={`${inter.variable} ${instrumentSerif.variable} ${montserrat.variable} ${playfairDisplay.variable} ${poppins.variable} ${roboto.variable} ${openSans.variable} ${lato.variable} ${merriweather.variable} ${oswald.variable} ${raleway.variable} ${sourceSans.variable} ${ubuntu.variable} ${cormorantGaramond.variable}`}>
        <RestaurantProvider>{children}</RestaurantProvider>
      </body>
    </html>
  );
}
