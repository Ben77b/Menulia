import Link from "next/link";
import { fetchDemoRestaurant, fetchAllRestaurants } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Eye, CalendarDays } from "lucide-react";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const restaurant = await fetchDemoRestaurant();
  const allRestaurants = await fetchAllRestaurants();

  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="mt-1 text-text-secondary">
        Managing <span className="font-medium text-text-primary">{restaurant.name}</span>
      </p>

      <Link
        href="/dashboard/preview"
        className="mt-8 flex items-center justify-between rounded-2xl border-2 border-emerald-brand bg-emerald-brand-light/40 p-6 transition hover:shadow-lg"
      >
        <div>
          <p className="text-sm font-medium text-emerald-brand">Guest Preview</p>
          <h2 className="mt-1 text-lg font-semibold">See how diners view your restaurant</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Full mobile preview in the same tab — go back to dashboard anytime.
          </p>
        </div>
        <Eye className="h-10 w-10 shrink-0 text-emerald-brand" />
      </Link>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: UtensilsCrossed, label: "Menu items", value: "9", href: "/dashboard/menu" },
          { icon: Eye, label: "Page views (30d)", value: "340", href: "/dashboard/analytics" },
          { icon: CalendarDays, label: "Pending reservations", value: "1", href: "/dashboard/reservations" },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-2xl border border-border bg-white p-5 transition-shadow hover:shadow-md"
          >
            <stat.icon className="h-5 w-5 text-emerald-brand" />
            <p className="mt-3 text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-text-secondary">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-white p-6">
        <h2 className="font-semibold">Sandbox demo restaurants</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Switch between pre-loaded profiles to test free vs. premium features.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {allRestaurants.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-xl border border-border p-4"
            >
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-text-secondary">
                  {r.is_premium ? "Premium" : "Free"}
                  {r.accepts_reservations && " · Reservations"}
                </p>
              </div>
              <Link href={`/${r.slug}`} target="_blank">
                <Button variant="outline" size="sm">
                  View
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
