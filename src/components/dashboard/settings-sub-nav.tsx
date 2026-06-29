"use client";

import { CapsuleNav, type CapsuleNavItem } from "@/components/dashboard/capsule-nav";

export type SettingsSubNavItem<T extends string> = CapsuleNavItem<T>;

interface SettingsSubNavProps<T extends string> {
  items: SettingsSubNavItem<T>[];
  active: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
  className?: string;
}

export function SettingsSubNav<T extends string>(props: SettingsSubNavProps<T>) {
  return <CapsuleNav {...props} />;
}
