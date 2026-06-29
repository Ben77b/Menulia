"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const DEMO_MENU_PATH = "/menu/santo-sushi";

interface LandingDevicePreviewProps {
  className?: string;
}

export function LandingDevicePreview({ className }: LandingDevicePreviewProps) {
  return (
    <Link
      href={DEMO_MENU_PATH}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("group relative mx-auto block w-full max-w-[300px] sm:max-w-[340px] md:max-w-[380px]", className)}
      aria-label="Open Santo Sushi live menu preview"
    >
      <div
        className="overflow-hidden rounded-2xl border border-border bg-white p-2.5 transition-all duration-300 group-hover:translate-y-[-2px]"
        style={{ boxShadow: "0 20px 50px rgba(0, 0, 0, 0.04)" }}
      >
        <div className="aspect-[9/19] w-full overflow-hidden rounded-[14px] border border-border bg-white">
          <iframe
            src={DEMO_MENU_PATH}
            title="Santo Sushi menu preview"
            className="h-full w-full border-0"
          />
        </div>
      </div>
      <span className="absolute -right-2 top-4 rounded-full border border-border bg-slate-900 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-white">
        Live preview
      </span>
    </Link>
  );
}
