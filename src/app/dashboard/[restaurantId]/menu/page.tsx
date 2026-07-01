"use client";

import { Suspense } from "react";
import { MenuBuilder } from "@/components/dashboard/menu-builder/menu-builder";
import { MenuBuilderSkeleton } from "@/components/ui/skeleton";

export default function MenuPage() {
  return (
    <Suspense fallback={<MenuBuilderSkeleton />}>
      <MenuBuilder />
    </Suspense>
  );
}
