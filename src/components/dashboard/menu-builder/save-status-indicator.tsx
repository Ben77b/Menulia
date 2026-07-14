"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function SaveStatusIndicator({
  status,
  className,
}: {
  status: SaveStatus;
  className?: string;
}) {
  const [visible, setVisible] = useState(status !== "idle");

  useEffect(() => {
    if (status === "idle") {
      setVisible(false);
      return;
    }

    setVisible(true);
    if (status === "saved") {
      const timer = window.setTimeout(() => setVisible(false), 1000);
      return () => window.clearTimeout(timer);
    }
  }, [status]);

  if (!visible || status === "idle") return null;

  return (
    <span
      aria-live="polite"
      className={cn(
        "inline-flex h-5 w-5 shrink-0 items-center justify-center transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {status === "saving" ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
      ) : status === "saved" ? (
        <Check className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <span className="h-2 w-2 rounded-full bg-red-500" />
      )}
    </span>
  );
}
