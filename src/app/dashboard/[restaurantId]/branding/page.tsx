"use client";

import { Suspense } from "react";
import { DesignProvider } from "@/contexts/design-context";
import { DesignStudio } from "@/components/dashboard/design-studio";
import { ClientErrorBoundary } from "@/components/ui/client-error-boundary";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function BrandingPage() {
  return (
    <DesignProvider>
      <ClientErrorBoundary title="Design Studio failed to load">
        <Suspense fallback={<LoadingSpinner label="Loading design studio..." />}>
          <DesignStudio />
        </Suspense>
      </ClientErrorBoundary>
    </DesignProvider>
  );
}
