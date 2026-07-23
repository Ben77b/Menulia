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
  const backgroundColor =
    splash?.backgroundColor || DEFAULT_PUBLIC_MENU_SPLASH.backgroundColor || "#ffffff";

  return (
    <PublicMenuSplashContext.Provider value={splash ?? DEFAULT_PUBLIC_MENU_SPLASH}>
      <div className="min-h-screen bg-white" style={{ backgroundColor }}>
        {children}
      </div>
    </PublicMenuSplashContext.Provider>
  );
}
