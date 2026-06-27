import type { RestaurantFull } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

interface PublicMenuTemplateProps {
  restaurant: RestaurantFull;
}

export function PublicMenuTemplate({ restaurant }: PublicMenuTemplateProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-8">
          {restaurant.logo && (
            <img
              src={restaurant.logo}
              alt={`${restaurant.name} logo`}
              className="h-16 w-16 rounded-xl object-cover"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
            <p className="mt-1 text-sm text-gray-500">Digital Menu</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {restaurant.categories.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-gray-500">
            This restaurant has not published any menu items yet.
          </p>
        ) : (
          <div className="space-y-8">
            {restaurant.categories.map((category) => (
              <section key={category.id} className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="text-xl font-semibold text-gray-900">{category.name}</h2>

                {category.items.length === 0 ? (
                  <p className="mt-4 text-sm text-gray-500">No items in this category.</p>
                ) : (
                  <ul className="mt-4 divide-y divide-gray-100">
                    {category.items.map((item) => (
                      <li key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="h-20 w-20 shrink-0 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex flex-1 items-start justify-between gap-4">
                          <div>
                            <h3 className="font-medium text-gray-900">{item.name}</h3>
                            {item.description && (
                              <p className="mt-1 text-sm text-gray-600">{item.description}</p>
                            )}
                            {item.tags.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {item.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <p className="shrink-0 font-medium text-gray-900">
                            {formatPrice(item.price)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
