"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PublicMenuSplashScreen } from "@/components/public/public-menu-splash-screen";

interface PublicMenuClientSplashGateProps {
  children: ReactNode;
}

export function PublicMenuClientSplashGate({ children }: PublicMenuClientSplashGateProps) {
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {children}
      {isPageLoading && (
        <div className="fixed inset-0 z-50">
          <PublicMenuSplashScreen />
        </div>
      )}
    </>
  );
}
