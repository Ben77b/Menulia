"use client";

import { Suspense, type ComponentProps } from "react";
import { PublicMenuLayout } from "@/components/public/public-menu-layout";
import { PublicMenuFilterProvider } from "@/components/public/public-menu-filter-context";

function PublicMenuFiltersFallback() {
  return (
    <div className="border-t border-black/5 px-6 py-6 text-center text-sm text-[#86868B]">
      Loading filters...
    </div>
  );
}

function PublicMenuShellInner(props: ComponentProps<typeof PublicMenuLayout>) {
  return (
    <PublicMenuFilterProvider>
      <PublicMenuLayout {...props} />
    </PublicMenuFilterProvider>
  );
}

export function PublicMenuShell(props: ComponentProps<typeof PublicMenuLayout>) {
  return (
    <Suspense fallback={<PublicMenuFiltersFallback />}>
      <PublicMenuShellInner {...props} />
    </Suspense>
  );
}
