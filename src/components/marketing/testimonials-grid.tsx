import type { PublicRestaurantProfile } from "@/lib/marketing/public-restaurants";
import type { MarketingLocale } from "@/lib/marketing/locale";
import { TESTIMONIALS_COPY } from "@/lib/marketing/locale";
import { ExternalLink } from "lucide-react";

type TestimonialsGridProps = {
  locale: MarketingLocale;
  restaurants: PublicRestaurantProfile[];
};

export function TestimonialsGrid({ locale, restaurants }: TestimonialsGridProps) {
  const copy = TESTIMONIALS_COPY[locale];

  return (
    <section className="px-4 pb-24 pt-28 sm:px-6 md:pb-32 md:pt-36">
      <div className="mx-auto max-w-6xl">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#22c55e]">
            {copy.eyebrow}
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
            {copy.subtitle}
          </p>
        </header>

        {restaurants.length === 0 ? (
          <p className="mt-16 text-center text-sm text-slate-500">{copy.empty}</p>
        ) : (
          <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant) => (
              <li key={restaurant.slug}>
                <article className="flex h-full flex-col rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-[#22c55e]/25 hover:shadow-[0_8px_32px_rgba(34,197,94,0.08)]">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                    {restaurant.name}
                  </h2>
                  {restaurant.description ? (
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
                      {restaurant.description}
                    </p>
                  ) : (
                    <div className="flex-1" />
                  )}
                  <a
                    href={`/menu/${restaurant.slug}`}
                    target="_blank"
                    rel="noopener"
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800 transition-colors hover:text-emerald-500"
                  >
                    {copy.viewMenu}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
