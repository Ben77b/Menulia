"use client";

import { DesignProvider } from "@/contexts/design-context";
import { BrandingDashboard } from "@/components/dashboard/branding-dashboard";

export default function BrandingPage() {
  return (
    <DesignProvider>
      <BrandingDashboard />
    </DesignProvider>
  );
}
