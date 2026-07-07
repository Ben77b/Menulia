"use client";

import { useActiveRestaurant } from "@/hooks/use-active-restaurant";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PremiumPaywall } from "@/components/dashboard/premium-paywall";
import { MenuImporter } from "@/components/dashboard/menu-importer";

export default function ImporterPage() {
  const { activeRestaurant, awaitingWorkspace } = useActiveRestaurant();

  if (awaitingWorkspace) {
    return <LoadingSpinner label="Loading importer…" />;
  }

  if (!activeRestaurant) {
    return (
      <div>
        <h1 className="text-2xl font-bold">AI Menu Importer</h1>
        <p className="mt-1 text-text-secondary">
          Upload a photo of your paper menu to automatically extract items.
        </p>
        <div className="mt-8 rounded-2xl border border-border bg-white p-6">
          <p className="text-sm text-text-secondary">Select a restaurant to use this feature.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">AI Menu Importer</h1>
      <p className="mt-1 text-text-secondary">
        Upload a photo of your paper menu to automatically extract items.
      </p>
      <div className="mt-8">
        <PremiumPaywall isPremium={false}>
          <MenuImporter />
        </PremiumPaywall>
        <p className="mt-4 text-sm text-text-secondary">
          Demo mode: uploaded menus return sample parsed items. Wire an OCR/AI endpoint to enable
          production imports.
        </p>
      </div>
    </div>
  );
}
