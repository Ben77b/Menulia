import Link from "next/link";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { fetchDemoRestaurant } from "@/lib/data";

export default async function DashboardMainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const restaurant = await fetchDemoRestaurant();

  return (
    <div className="flex min-h-dvh">
      <DashboardSidebar
        isPremium={restaurant.is_premium}
        restaurantName={restaurant.name}
      />
      <div className="flex-1 overflow-auto">
        <div className="border-b border-border bg-surface-elevated px-6 py-4">
          <p className="text-sm text-text-secondary">
            Public menu:{" "}
            <a
              href={`/${restaurant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-brand hover:underline"
            >
              menulia.io/{restaurant.slug}
            </a>
            {" · "}
            <Link
              href="/dashboard/preview"
              className="font-medium text-coral-cta hover:underline"
            >
              Preview as guest →
            </Link>
          </p>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
