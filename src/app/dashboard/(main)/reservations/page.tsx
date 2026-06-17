"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PremiumPaywall } from "@/components/dashboard/premium-paywall";
import { ReservationsTable } from "@/components/dashboard/reservations-table";
import { FloorplanDesigner } from "@/components/dashboard/floorplan-designer";
import { fetchDemoRestaurant, fetchReservations } from "@/lib/data";
import { AlertCircle, Settings, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReservationsPage() {
  const [restaurant, setRestaurant] = useState<any>(null);
  const [reservations, setReservations] = useState<any>(null);
  const [contactDetails, setContactDetails] = useState({ email: "", phone: "", location: "" });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"bookings" | "floorplan">("bookings");

  useEffect(() => {
    async function loadData() {
      const r = await fetchDemoRestaurant();
      const res = await fetchReservations(r.id);
      setRestaurant(r);
      setReservations(res);
      
      // Load contact details from localStorage
      const email = localStorage.getItem(`restaurant-email-${r.id}`) || "";
      const phone = localStorage.getItem(`restaurant-phone-${r.id}`) || "";
      const location = localStorage.getItem(`restaurant-location-${r.id}`) || "";
      setContactDetails({ email, phone, location });
      setLoading(false);
    }
    loadData();
  }, []);

  const hasRequiredDetails = contactDetails.email && contactDetails.location;

  if (loading) return <div>Loading...</div>;

  if (!restaurant.is_premium) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Reservations</h1>
        <p className="mt-1 text-text-secondary">
          Manage incoming booking requests chronologically.
        </p>
        <div className="mt-8">
          <PremiumPaywall isPremium={false}>
            <div />
          </PremiumPaywall>
        </div>
      </div>
    );
  }

  if (!hasRequiredDetails) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Reservations</h1>
        <p className="mt-1 text-text-secondary">
          Manage incoming booking requests chronologically.
        </p>
        <div className="mt-8 rounded-2xl border-2 border-amber-200 bg-amber-50 p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-amber-100 p-3">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-amber-900">
                Complete your restaurant details
              </h2>
              <p className="mt-2 text-sm text-amber-700">
                To enable reservations and receive booking notifications, please fill in your contact details:
              </p>
              <ul className="mt-3 space-y-1 text-sm text-amber-700">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Email address (required for notifications)
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Phone number
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Restaurant location / address
                </li>
              </ul>
              <Link href="/dashboard/settings">
                <Button className="mt-6">
                  <Settings className="h-4 w-4 mr-2" />
                  Go to Settings
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reservations</h1>
          <p className="mt-1 text-text-secondary">
            Manage bookings and restaurant layout
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === "bookings" ? "primary" : "outline"}
            onClick={() => setActiveTab("bookings")}
          >
            Bookings
          </Button>
          <Button
            variant={activeTab === "floorplan" ? "primary" : "outline"}
            onClick={() => setActiveTab("floorplan")}
          >
            Floorplan Designer
          </Button>
        </div>
      </div>

      {activeTab === "bookings" ? (
        <ReservationsTable initialReservations={reservations} />
      ) : (
        <FloorplanDesigner restaurantId={restaurant.id} />
      )}
    </div>
  );
}
