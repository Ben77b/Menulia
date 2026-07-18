import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-gradient-to-r from-[#EBEBED] via-[#F5F5F7] to-[#EBEBED] bg-[length:200%_100%]",
        className
      )}
      style={{ animation: "skeleton-shimmer 1.4s ease-in-out infinite" }}
    />
  );
}

export function MenuBuilderSkeleton() {
  return (
    <div className="air-page">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32 rounded-[var(--radius)]" />
      </div>

      <Skeleton className="mt-8 h-12 w-full rounded-[14px]" />

      <div className="air-card air-card-pad mt-8 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 border-t border-[#F5F5F7] pt-5 first:border-t-0 first:pt-0">
            <Skeleton className="h-12 w-12 shrink-0 rounded-[10px]" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
            <Skeleton className="h-4 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}
