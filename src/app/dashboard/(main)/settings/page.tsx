import { fetchDemoRestaurant, fetchRestaurantBySlug } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { DesignSettings } from "@/components/dashboard/design-settings";
import { SettingsInfoPanel } from "@/components/dashboard/settings-info-panel";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const restaurant = await fetchDemoRestaurant();
  const full = await fetchRestaurantBySlug(restaurant.slug);

  return (
    <div>
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-1 text-text-secondary">Manage your restaurant profile, design, and public page content.</p>

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
          <Button className="mt-4">Save changes</Button>
        </div>

        <DesignSettings restaurantId={restaurant.id} />

        <SettingsInfoPanel
          restaurantId={restaurant.id}
          defaultPhone={restaurant.phone}
          defaultEmail={restaurant.contact_email}
          defaultAddress={restaurant.address}
          defaultInstagram={restaurant.instagram_url}
          defaultFacebook={restaurant.facebook_url}
          defaultWebsite={restaurant.website_url}
          defaultWhatsapp={restaurant.whatsapp_url}
          defaultHours={full?.operating_hours ?? []}
        />

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
      </div>
    </div>
  );
}

