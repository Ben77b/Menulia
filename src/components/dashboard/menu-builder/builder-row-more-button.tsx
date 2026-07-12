"use client";

import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface BuilderRowMoreButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function BuilderRowMoreButton({
  onClick,
  label = "More actions",
  className,
  disabled = false,
}: BuilderRowMoreButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-[#F5F5F7] hover:text-slate-800 disabled:opacity-40",
        className
      )}
    >
      <MoreHorizontal className="h-5 w-5" />
    </button>
  );
}
