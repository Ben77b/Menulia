"use client";

import Link from "next/link";

const DEMO_MENU_PATH = "/menu/santo-sushi";

export function LandingDevicePreview() {
  return (
    <Link
      href={DEMO_MENU_PATH}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative mx-auto block w-full max-w-[280px] lg:max-w-none"
      aria-label="Open Santo Sushi live menu preview"
    >
      <div className="air-card overflow-hidden p-2 transition-all duration-200 group-hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
        <div className="aspect-[9/19] max-h-[min(52vh,520px)] w-full overflow-hidden rounded-[1.25rem] border border-border bg-white">
          <iframe
            src={DEMO_MENU_PATH}
            title="Santo Sushi menu preview"
            className="h-full w-full border-0"
          />
        </div>
      </div>
      <span className="absolute -right-1 -top-1 rounded-full border border-border bg-slate-900 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-white">
        Live preview
      </span>
    </Link>
  );
}
