import { PremiumPaywall } from "@/components/dashboard/premium-paywall";
import { MenuImporter } from "@/components/dashboard/menu-importer";
import { fetchDemoRestaurant } from "@/lib/data";

export const metadata = { title: "AI Menu Importer" };

export default async function ImporterPage() {
  const restaurant = await fetchDemoRestaurant();

  if (!restaurant) {
    return (
      <div>
        <h1 className="text-2xl font-bold">AI Menu Importer</h1>
        <p className="mt-1 text-text-secondary">
          Upload a photo of your paper menu to automatically extract items.
        </p>
        <div className="mt-8">
          <div className="rounded-2xl border border-border bg-white p-6">
            <p className="text-sm text-text-secondary">Please select a restaurant to use this feature.</p>
          </div>
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
        <PremiumPaywall isPremium={(restaurant as any).is_premium || false}>
          <MenuImporter />
        </PremiumPaywall>
      </div>
    </div>
  );
}
