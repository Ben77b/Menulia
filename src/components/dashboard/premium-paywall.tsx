import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PremiumPaywallProps {
  children: React.ReactNode;
  isPremium: boolean;
}

export function PremiumPaywall({ children, isPremium }: PremiumPaywallProps) {
  if (isPremium) return <>{children}</>;

  return (
    <div className="relative min-h-[400px]">
      <div className="pointer-events-none select-none blur-[2px] opacity-40">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="glass-frost max-w-md rounded-2xl border border-border p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-brand-light">
            <Crown className="h-7 w-7 text-emerald-brand" />
          </div>
          <span className="inline-block rounded-full bg-emerald-brand px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            Premium
          </span>
          <h3 className="mt-4 text-lg font-semibold">
            Unlock reservations, automated layout importing, and interactive performance charts
          </h3>
          <p className="mt-2 text-sm text-text-secondary">
            Upgrade to Premium and grow your restaurant with powerful tools built for hospitality.
          </p>
          <Button className="mt-6 w-full" size="lg">
            Upgrade to Premium
          </Button>
        </div>
      </div>
    </div>
  );
}
