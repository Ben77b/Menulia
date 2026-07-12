import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReorderButtonsProps {
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  disabled?: boolean;
  className?: string;
  /** Fade in on parent `.group` hover; always visible on small screens */
  revealOnHover?: boolean;
  /** When false, hidden on viewports under md (use with Reorder Mode). */
  mobileEnabled?: boolean;
}

export function ReorderButtons({
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  disabled = false,
  className,
  revealOnHover = false,
  mobileEnabled = true,
}: ReorderButtonsProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col",
        revealOnHover && "opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100",
        !mobileEnabled && "max-md:hidden",
        className
      )}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onMoveUp();
        }}
        disabled={disabled || !canMoveUp}
        aria-label="Move up"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-[#C7C7CC] transition-colors hover:bg-[#F5F5F7] hover:text-slate-600 disabled:opacity-30"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onMoveDown();
        }}
        disabled={disabled || !canMoveDown}
        aria-label="Move down"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-[#C7C7CC] transition-colors hover:bg-[#F5F5F7] hover:text-slate-600 disabled:opacity-30"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}

export function moveByIndex<T>(items: T[], index: number, direction: -1 | 1): T[] | null {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= items.length) return null;
  const next = [...items];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}
