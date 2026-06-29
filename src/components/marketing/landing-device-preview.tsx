"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const DEMO_MENU_PATH = "/menu/santo-sushi";

interface LandingDevicePreviewProps {
  className?: string;
  /** Light page vs inverted dark hero capsule */
  tone?: "light" | "dark";
}

export function LandingDevicePreview({ className, tone = "light" }: LandingDevicePreviewProps) {
  const onDark = tone === "dark";

  return (
    <Link
      href={DEMO_MENU_PATH}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative mx-auto block w-full max-w-[280px] sm:max-w-[300px] md:max-w-[340px] lg:max-w-[360px]",
        className
      )}
      aria-label="Open Santo Sushi live menu preview"
    >
      <div
        className={cn(
          "overflow-hidden rounded-2xl border bg-white p-2.5 transition-all duration-300 group-hover:translate-y-[-2px]",
          onDark ? "border-white/10" : "border-border"
        )}
        style={{
          boxShadow: onDark
            ? "0 24px 64px rgba(0, 0, 0, 0.45), 0 0 72px rgba(255, 255, 255, 0.08)"
            : "0 20px 50px rgba(0, 0, 0, 0.04)",
        }}
      >
        <div
          className={cn(
            "aspect-[9/19] w-full overflow-hidden rounded-[14px] border bg-white",
            onDark ? "border-white/10" : "border-border"
          )}
        >
          <iframe
            src={DEMO_MENU_PATH}
            title="Santo Sushi menu preview"
            className="h-full w-full border-0"
          />
        </div>
      </div>
      <span
        className={cn(
          "absolute -right-2 top-4 rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-wider",
          onDark
            ? "border-white/20 bg-white/10 text-white backdrop-blur-sm"
            : "border-border bg-slate-900 text-white"
        )}
      >
        Live preview
      </span>
    </Link>
  );
}
