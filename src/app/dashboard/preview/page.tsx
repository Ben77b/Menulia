"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useActiveRestaurant } from "@/hooks/use-active-restaurant";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getPublicMenuUrl } from "@/lib/site-url";
import { Button } from "@/components/ui/button";

export default function PreviewPage() {
  const { activeRestaurant, awaitingWorkspace } = useActiveRestaurant();

  if (awaitingWorkspace) {
    return <LoadingSpinner label="Loading preview…" />;
  }

  if (!activeRestaurant) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <p className="text-muted-foreground">Select a restaurant to preview its public menu.</p>
        <Link href="/dashboard">
          <Button className="mt-4">Go to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const menuUrl = getPublicMenuUrl(activeRestaurant.slug);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-zinc-900 px-4 py-3 text-white">
        <Link
          href={`/dashboard/${activeRestaurant.id}`}
          className="flex items-center gap-2 text-sm font-medium transition hover:text-emerald-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <span className="text-sm text-zinc-400">
          Preview — <strong className="text-white">{activeRestaurant.name}</strong>
        </span>
        <Button
          href={menuUrl}
          target="_blank"
          rel="noopener noreferrer"
          variant="light"
          size="sm"
          isExternal
          className="border-zinc-600 bg-zinc-800 text-white hover:bg-zinc-700"
        >
          Open full screen
        </Button>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden bg-zinc-950 p-4">
        <div className="h-full max-h-[900px] w-full max-w-[430px] overflow-hidden rounded-[2rem] border-4 border-zinc-700 shadow-2xl bg-white">
          <iframe
            src={menuUrl}
            title={`${activeRestaurant.name} menu preview`}
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
