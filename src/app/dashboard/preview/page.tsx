import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { fetchDemoRestaurant, fetchRestaurantBySlug } from "@/lib/data";
import { DinerApp } from "@/components/public/diner-app";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Preview Your Restaurant" };

export default async function PreviewPage() {
  const restaurant = await fetchDemoRestaurant();

  if (!restaurant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white">
        <p className="text-zinc-400">Please select a restaurant to preview.</p>
        <Link href="/dashboard">
          <Button className="mt-4">Go to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const restaurantAny = restaurant as any;
  const slug = restaurantAny.slug || restaurantAny.id;
  const full = await fetchRestaurantBySlug(slug);

  if (!full) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Top bar — stays in same tab */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-zinc-900 px-4 py-3 text-white">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm font-medium transition hover:text-emerald-brand-light"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <span className="text-sm text-zinc-400">
          Preview — how guests see <strong className="text-white">{restaurantAny.name}</strong>
        </span>
        <Link href={`/${slug}`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="border-zinc-600 text-white hover:bg-zinc-800">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Open full screen
          </Button>
        </Link>
      </div>

      {/* Phone-frame preview */}
      <div className="flex flex-1 items-center justify-center overflow-hidden bg-zinc-950 p-4">
        <div className="h-full max-h-[900px] w-full max-w-[430px] overflow-hidden rounded-[2rem] border-4 border-zinc-700 shadow-2xl">
          <DinerApp restaurant={full} previewMode />
        </div>
      </div>
    </div>
  );
}
