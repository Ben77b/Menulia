"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useRestaurant } from "@/contexts/restaurant-context";

interface DashboardAuthGuardProps {
  children: React.ReactNode;
}

export function DashboardAuthGuard({ children }: DashboardAuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { authReady, user, loading } = useRestaurant();

  useEffect(() => {
    if (!authReady || loading) return;

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [authReady, user, loading, pathname, router]);

  if (!authReady || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-gray-500">Loading your account...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
