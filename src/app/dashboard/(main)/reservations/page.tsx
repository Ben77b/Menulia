import { PremiumPaywall } from "@/components/dashboard/premium-paywall";
import { ReservationsTable } from "@/components/dashboard/reservations-table";
import { fetchDemoRestaurant, fetchReservations } from "@/lib/data";

export const metadata = { title: "Reservations" };

export default async function ReservationsPage() {
  const restaurant = await fetchDemoRestaurant();
  const reservations = await fetchReservations(restaurant.id);

  return (
    <div>
      <h1 className="text-2xl font-bold">Reservations</h1>
      <p className="mt-1 text-text-secondary">
        Manage incoming booking requests chronologically.
      </p>
      <div className="mt-8">
        <PremiumPaywall isPremium={restaurant.is_premium}>
          <ReservationsTable initialReservations={reservations} />
        </PremiumPaywall>
      </div>
    </div>
  );
}
