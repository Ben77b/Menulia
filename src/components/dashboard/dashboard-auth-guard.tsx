"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useRestaurant } from "@/contexts/restaurant-context";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface DashboardAuthGuardProps {
  children: React.ReactNode;
}

export function DashboardAuthGuard({ children }: DashboardAuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { bootstrapped, user, loading } = useRestaurant();

  useEffect(() => {
    if (!bootstrapped || loading) return;

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [bootstrapped, user, loading, pathname, router]);

  if (!bootstrapped || loading) {
    return <LoadingSpinner label="Preparing your dashboard..." />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
