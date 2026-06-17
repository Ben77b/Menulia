"use client";

import { useState, useEffect } from "react";
import { fetchDemoRestaurant } from "@/lib/data";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [restaurant, setRestaurant] = useState<any>(null);
  const [footerNote, setFooterNote] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    async function loadData() {
      const r = await fetchDemoRestaurant();
      setRestaurant(r);
      // Load saved settings from localStorage
      const savedFooter = localStorage.getItem(`footer-note-${r.id}`);
      const savedEmail = localStorage.getItem(`restaurant-email-${r.id}`);
      const savedPhone = localStorage.getItem(`restaurant-phone-${r.id}`);
      const savedLocation = localStorage.getItem(`restaurant-location-${r.id}`);
      if (savedFooter) setFooterNote(savedFooter);
      if (savedEmail) setEmail(savedEmail);
      if (savedPhone) setPhone(savedPhone);
      if (savedLocation) setLocation(savedLocation);
    }
    loadData();
  }, []);

  function handleSave() {
    if (restaurant) {
      localStorage.setItem(`footer-note-${restaurant.id}`, footerNote);
      localStorage.setItem(`restaurant-email-${restaurant.id}`, email);
      localStorage.setItem(`restaurant-phone-${restaurant.id}`, phone);
      localStorage.setItem(`restaurant-location-${restaurant.id}`, location);
      alert("Settings saved!");
    }
  }

  if (!restaurant) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-text-secondary">Manage your restaurant profile and account settings.</p>

      <div className="mt-8 max-w-3xl space-y-6">
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-semibold">Restaurant profile</h2>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-sm text-text-secondary">Name</label>
              <input
                defaultValue={restaurant.name}
                className="mt-1 w-full rounded-xl border border-border px-4 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary">Slug</label>
              <input
                defaultValue={restaurant.slug}
                className="mt-1 w-full rounded-xl border border-border px-4 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" defaultChecked={restaurant.accepts_reservations} />
              Accept reservations
            </label>
          </div>
          <Button className="mt-4" onClick={handleSave}>Save changes</Button>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-semibold">Contact details (required for reservations)</h2>
          <p className="mt-1 text-sm text-text-secondary">
            These details are required to enable reservations and receive booking notifications.
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-sm text-text-secondary">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="mt-1 w-full rounded-xl border border-border px-4 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary">Phone number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 890"
                className="mt-1 w-full rounded-xl border border-border px-4 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary">Location / Address</label>
              <textarea
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="123 Main St, City, Country"
                className="mt-1 w-full rounded-xl border border-border px-4 py-2 text-sm"
                rows={2}
              />
            </div>
          </div>
          <Button className="mt-4" onClick={handleSave}>Save contact details</Button>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-semibold">Footer note</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Add a custom note that will appear in the footer of your public page.
          </p>
          <div className="mt-4">
            <textarea
              value={footerNote}
              onChange={(e) => setFooterNote(e.target.value)}
              placeholder="e.g., Open daily from 12pm to 10pm. Reservations recommended."
              className="w-full rounded-xl border border-border px-4 py-2 text-sm"
              rows={3}
            />
          </div>
          <Button className="mt-4" onClick={handleSave}>Save footer note</Button>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-semibold">Plan</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Current plan:{" "}
            <span className="font-medium text-emerald-brand">
              {restaurant.is_premium ? "Premium" : "Free"}
            </span>
          </p>
          {!restaurant.is_premium && (
            <Button className="mt-4">Upgrade to Premium</Button>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-semibold">Account</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Manage your account settings and preferences.
          </p>
          <Button variant="outline" className="mt-4">
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
