"use client";

import { DesignProvider } from "@/contexts/design-context";
import { DesignStudio } from "@/components/dashboard/design-studio";

export default function BrandingPage() {
  return (
    <DesignProvider>
      <DesignStudio />
    </DesignProvider>
  );
}
