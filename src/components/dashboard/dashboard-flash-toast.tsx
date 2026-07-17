"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/toast";

export function DashboardFlashToast() {
  const toast = useToast();

  useEffect(() => {
    const raw = sessionStorage.getItem("menulia:flash-toast");
    if (!raw) return;

    sessionStorage.removeItem("menulia:flash-toast");

    try {
      const parsed = JSON.parse(raw) as { message?: string; variant?: string };
      const message = parsed.message ?? raw;
      if (parsed.variant === "error") {
        toast.error(message);
      } else {
        toast.success(message);
      }
    } catch {
      toast.success(raw);
    }
  }, [toast]);

  return null;
}
