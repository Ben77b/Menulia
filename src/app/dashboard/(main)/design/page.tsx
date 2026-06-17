"use client";

import { DesignProvider } from "@/contexts/design-context";
import { BrandingDashboard } from "@/components/dashboard/branding-dashboard";

export default function DesignPage() {
  return (
    <DesignProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Branding & Design</h1>
          <p className="text-muted-foreground">
            Customize your restaurant's visual identity. Changes sync in real-time.
          </p>
        </div>
        
        <BrandingDashboard />
      </div>
    </DesignProvider>
  );
}
