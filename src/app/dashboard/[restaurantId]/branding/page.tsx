"use client";

import { DesignProvider } from "@/contexts/design-context";
import { DesignStudio } from "@/components/dashboard/design-studio";
import { ClientErrorBoundary } from "@/components/ui/client-error-boundary";

export default function BrandingPage() {
  return (
    <DesignProvider>
      <ClientErrorBoundary title="Design Studio failed to load">
        <DesignStudio />
      </ClientErrorBoundary>
    </DesignProvider>
  );
}
