import { fetchDemoRestaurant, fetchRestaurantBySlug } from "@/lib/data";

export const metadata = { title: "Menu Management" };

export default async function MenuPage() {
  const restaurant = await fetchDemoRestaurant();
  const full = await fetchRestaurantBySlug(restaurant.slug);

  return (
    <div>
      <h1 className="text-2xl font-bold">Menu</h1>
      <p className="mt-1 text-text-secondary">Manage categories and items for your digital menu.</p>

      <div className="mt-8 space-y-6">
        {full?.categories.map((cat) => (
          <div key={cat.id} className="rounded-2xl border border-border bg-white">
            <div className="border-b border-border px-6 py-4">
              <h2 className="font-semibold">{cat.name}</h2>
              <p className="text-sm text-text-secondary">{cat.items.length} items</p>
            </div>
            <ul className="divide-y divide-border">
              {cat.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-text-secondary">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-brand">€{item.price.toFixed(2)}</p>
                    <p className="text-xs text-text-secondary">
                      {item.is_available ? "Available" : "Unavailable"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
