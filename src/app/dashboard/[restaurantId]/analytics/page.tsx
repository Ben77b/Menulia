import { PremiumPaywall } from "@/components/dashboard/premium-paywall";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import { ExpenseLedger } from "@/components/dashboard/expense-ledger";
import {
  fetchDemoRestaurant,
  fetchPageViews,
  fetchReservations,
  fetchExpenses,
} from "@/lib/data";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const restaurant = await fetchDemoRestaurant();

  if (!restaurant) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="mt-1 text-text-secondary">
          Traffic, conversions, seasonality, and operational expenses.
        </p>
        <div className="mt-8">
          <div className="rounded-2xl border border-border bg-white p-6">
            <p className="text-sm text-text-secondary">Please select a restaurant to view analytics.</p>
          </div>
        </div>
      </div>
    );
  }

  const restaurantAny = restaurant as any;
  const [pageViews, reservations, expenses] = await Promise.all([
    fetchPageViews(restaurantAny.id),
    fetchReservations(restaurantAny.id),
    fetchExpenses(restaurantAny.id),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Analytics</h1>
      <p className="mt-1 text-text-secondary">
        Traffic, conversions, seasonality, and operational expenses.
      </p>
      <div className="mt-8">
        <PremiumPaywall isPremium={restaurantAny.is_premium || false}>
          <AnalyticsCharts
            pageViews={pageViews}
            reservations={reservations}
            expenses={expenses}
          />
          <div className="mt-8">
            <ExpenseLedger initialExpenses={expenses} restaurantId={restaurantAny.id} />
          </div>
        </PremiumPaywall>
      </div>
    </div>
  );
}
