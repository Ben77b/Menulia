import { PremiumPaywall } from "@/components/dashboard/premium-paywall";
import { MenuImporter } from "@/components/dashboard/menu-importer";
import { fetchDemoRestaurant } from "@/lib/data";

export const metadata = { title: "AI Menu Importer" };

export default async function ImporterPage() {
  const restaurant = await fetchDemoRestaurant();

  return (
    <div>
      <h1 className="text-2xl font-bold">AI Menu Importer</h1>
      <p className="mt-1 text-text-secondary">
        Upload a photo of your paper menu to automatically extract items.
      </p>
      <div className="mt-8">
        <PremiumPaywall isPremium={restaurant.is_premium}>
          <MenuImporter />
        </PremiumPaywall>
      </div>
    </div>
  );
}
