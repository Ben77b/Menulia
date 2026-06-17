import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RestaurantProvider } from "@/contexts/restaurant-context";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "menulia.io — Digital Menus & Reservations for Restaurants",
    template: "%s | menulia.io",
  },
  description:
    "Premium SaaS platform for restaurant owners to digitize menus, manage reservations, and delight diners with 28+ language interactive displays.",
  manifest: "/manifest.json",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://menulia.io"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "menulia.io",
    title: "menulia.io — Digital Menus for Restaurants",
    description: "Stunning multi-language digital menus, reservations, and analytics for modern restaurants.",
  },
  twitter: {
    card: "summary_large_image",
    title: "menulia.io",
    description: "Digital menus and reservations for modern restaurants.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#047857",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+Pro:wght@400;600&family=Inter:wght@400;500;600;700&family=Lora:wght@400;600;700&family=Open+Sans:wght@400;600&family=Montserrat:wght@400;600;700&family=Roboto:wght@400;500;600&family=Space+Grotesk:wght@400;600;700&family=DM+Sans:wght@400;500;600&family=Merriweather:wght@400;600;700&family=Lato:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.variable}>
        <RestaurantProvider>{children}</RestaurantProvider>
      </body>
    </html>
  );
}
