import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReorderButtonsProps {
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  disabled?: boolean;
  className?: string;
}

export function ReorderButtons({
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  disabled = false,
  className,
}: ReorderButtonsProps) {
  return (
    <div className={cn("flex shrink-0 flex-col", className)}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onMoveUp();
        }}
        disabled={disabled || !canMoveUp}
        aria-label="Move up"
        className="rounded-md p-0.5 text-[#C7C7CC] transition-colors hover:bg-[#F5F5F7] hover:text-slate-600 disabled:opacity-30"
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
        className="rounded-md p-0.5 text-[#C7C7CC] transition-colors hover:bg-[#F5F5F7] hover:text-slate-600 disabled:opacity-30"
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
