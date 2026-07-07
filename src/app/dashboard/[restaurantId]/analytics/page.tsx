"use client";

import { useActiveRestaurant } from "@/hooks/use-active-restaurant";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PremiumPaywall } from "@/components/dashboard/premium-paywall";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import { ExpenseLedger } from "@/components/dashboard/expense-ledger";

export default function AnalyticsPage() {
  const { activeRestaurant, awaitingWorkspace } = useActiveRestaurant();

  if (awaitingWorkspace) {
    return <LoadingSpinner label="Loading analytics…" />;
  }

  if (!activeRestaurant) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="mt-1 text-text-secondary">
          Traffic, conversions, seasonality, and operational expenses.
        </p>
        <div className="mt-8 rounded-2xl border border-border bg-white p-6">
          <p className="text-sm text-text-secondary">Select a restaurant to view analytics.</p>
        </div>
      </div>
    );
  }

  const pageViews: never[] = [];
  const reservations: never[] = [];
  const expenses: never[] = [];

  return (
    <div>
      <h1 className="text-2xl font-bold">Analytics</h1>
      <p className="mt-1 text-text-secondary">
        Traffic, conversions, seasonality, and operational expenses.
      </p>
      <div className="mt-8">
        <PremiumPaywall isPremium={false}>
          <AnalyticsCharts pageViews={pageViews} reservations={reservations} expenses={expenses} />
          <div className="mt-8">
            <ExpenseLedger initialExpenses={expenses} restaurantId={activeRestaurant.id} />
          </div>
        </PremiumPaywall>
        <p className="mt-6 text-sm text-text-secondary">
          Analytics tables are not configured yet. Connect page views, reservations, and expenses in
          Supabase to populate these charts.
        </p>
      </div>
    </div>
  );
}
