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
  const [pageViews, reservations, expenses] = await Promise.all([
    fetchPageViews(restaurant.id),
    fetchReservations(restaurant.id),
    fetchExpenses(restaurant.id),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Analytics</h1>
      <p className="mt-1 text-text-secondary">
        Traffic, conversions, seasonality, and operational expenses.
      </p>
      <div className="mt-8">
        <PremiumPaywall isPremium={restaurant.is_premium}>
          <AnalyticsCharts
            pageViews={pageViews}
            reservations={reservations}
            expenses={expenses}
          />
          <div className="mt-8">
            <ExpenseLedger initialExpenses={expenses} restaurantId={restaurant.id} />
          </div>
        </PremiumPaywall>
      </div>
    </div>
  );
}
