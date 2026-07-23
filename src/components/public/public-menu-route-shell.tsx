"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  DEFAULT_PUBLIC_MENU_SPLASH,
  type PublicMenuSplashTheme,
} from "@/lib/public-menu-cache";

const PublicMenuSplashContext = createContext<PublicMenuSplashTheme>(DEFAULT_PUBLIC_MENU_SPLASH);

export function usePublicMenuSplash(): PublicMenuSplashTheme {
  return useContext(PublicMenuSplashContext);
}

interface PublicMenuRouteShellProps {
  splash: PublicMenuSplashTheme;
  children: ReactNode;
}

export function PublicMenuRouteShell({ splash, children }: PublicMenuRouteShellProps) {
  const theme = splash ?? DEFAULT_PUBLIC_MENU_SPLASH;
  const backgroundColor =
    theme.backgroundColor || DEFAULT_PUBLIC_MENU_SPLASH.backgroundColor || "#fafafa";
  const accentColor = theme.accentColor || DEFAULT_PUBLIC_MENU_SPLASH.accentColor;

  return (
    <PublicMenuSplashContext.Provider value={theme}>
      <div
        className="public-menu-route-shell min-h-screen w-full"
        style={{
          backgroundColor,
          ["--public-menu-bg" as string]: backgroundColor,
          ["--public-menu-accent" as string]: accentColor,
        }}
      >
        {children}
      </div>
    </PublicMenuSplashContext.Provider>
  );
}
