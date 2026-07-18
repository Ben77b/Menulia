"use client";

import type { ReactNode } from "react";
import {
  Copy,
  Eye,
  EyeOff,
  FileText,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardLocale } from "@/contexts/dashboard-locale-context";
import { type CategoryLayoutType } from "@/lib/category-layout";
import type { BuilderContextTarget } from "./builder-context-target";
import { CategoryLayoutSegment } from "./category-layout-segment";

interface BuilderContextActionsSheetProps {
  target: BuilderContextTarget | null;
  onClose: () => void;
  onEditDish: (target: Extract<BuilderContextTarget, { kind: "dish" }>) => void;
  onEditCategoryName?: (target: Extract<BuilderContextTarget, { kind: "category" }>) => void;
  onEditCategoryNote?: (target: Extract<BuilderContextTarget, { kind: "category" }>) => void;
  onToggleDishVisibility: (target: Extract<BuilderContextTarget, { kind: "dish" }>) => void;
  onDuplicate: (target: BuilderContextTarget) => void;
  onDelete: (target: BuilderContextTarget) => void;
  onLayoutChange: (
    target: Extract<BuilderContextTarget, { kind: "category" }>,
    layout: CategoryLayoutType
  ) => void;
  busy?: boolean;
}

function ActionRow({
  icon,
  label,
  onClick,
  destructive = false,
  disabled = false,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors",
        destructive
          ? "text-red-600 hover:bg-red-50"
          : "text-slate-800 hover:bg-[#F5F5F7]",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5F5F7] text-slate-600">
        {icon}
      </span>
      {label}
    </button>
  );
}

export function BuilderContextActionsSheet({
  target,
  onClose,
  onEditDish,
  onEditCategoryName,
  onEditCategoryNote,
  onToggleDishVisibility,
  onDuplicate,
  onDelete,
  onLayoutChange,
  busy = false,
}: BuilderContextActionsSheetProps) {
  const { t } = useDashboardLocale();
  const open = target !== null;

  function run(action: () => void) {
    action();
    onClose();
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/30 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="builder-actions-title"
        className={cn(
          "fixed z-[70] flex max-h-[85vh] flex-col bg-white transition-all duration-300 ease-out",
          "inset-x-0 bottom-0 rounded-t-2xl border-t border-[#E5E5EA] shadow-[0_-12px_40px_rgba(0,0,0,0.12)]",
          "md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-md md:-translate-x-1/2 md:rounded-2xl md:border md:shadow-2xl",
          open
            ? "translate-y-0 md:-translate-y-1/2 md:opacity-100"
            : "pointer-events-none translate-y-full md:translate-y-[calc(-50%+12px)] md:opacity-0"
        )}
        aria-hidden={!open}
      >
        <div className="flex shrink-0 justify-center pt-3 md:hidden" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-slate-200" />
        </div>

        <div className="shrink-0 border-b border-[#F5F5F7] px-5 py-4">
          <h2 id="builder-actions-title" className="truncate text-lg font-semibold text-slate-900">
            {target?.title ?? t("builder.actions.title")}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
          {target?.kind === "dish" && (
            <div className="flex flex-col gap-1">
              <ActionRow
                icon={<Pencil className="h-4 w-4" />}
                label={t("builder.actions.editDetails")}
                disabled={busy}
                onClick={() => run(() => onEditDish(target))}
              />
              <ActionRow
                icon={
                  target.dish.is_available === false ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )
                }
                label={
                  target.dish.is_available === false
                    ? t("builder.actions.showOnMenu")
                    : t("builder.actions.hideFromMenu")
                }
                disabled={busy}
                onClick={() => run(() => onToggleDishVisibility(target))}
              />
              <ActionRow
                icon={<Copy className="h-4 w-4" />}
                label={t("builder.actions.duplicate")}
                disabled={busy}
                onClick={() => run(() => onDuplicate(target))}
              />
            </div>
          )}

          {target?.kind === "category" && (
            <div className="flex flex-col gap-3">
              {onEditCategoryName ? (
                <ActionRow
                  icon={<Pencil className="h-4 w-4" />}
                  label={t("builder.actions.renameCategory")}
                  disabled={busy}
                  onClick={() => run(() => onEditCategoryName(target))}
                />
              ) : null}
              {onEditCategoryNote ? (
                <ActionRow
                  icon={<FileText className="h-4 w-4" />}
                  label={t("builder.actions.editCategoryNote")}
                  disabled={busy}
                  onClick={() => run(() => onEditCategoryNote(target))}
                />
              ) : null}
              <CategoryLayoutSegment
                value={target.category.layout_type}
                disabled={busy}
                onChange={(layout) => onLayoutChange(target, layout)}
              />
              <ActionRow
                icon={<Copy className="h-4 w-4" />}
                label={t("builder.actions.duplicate")}
                disabled={busy}
                onClick={() => run(() => onDuplicate(target))}
              />
            </div>
          )}

          {target && (
            <div className="mt-3 border-t border-[#F5F5F7] pt-2">
              <ActionRow
                icon={<Trash2 className="h-4 w-4" />}
                label={
                  target.kind === "section"
                    ? t("builder.actions.deleteSection")
                    : target.kind === "category"
                      ? t("builder.actions.deleteCategory")
                      : t("builder.actions.delete")
                }
                destructive
                disabled={busy}
                onClick={() => run(() => onDelete(target))}
              />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
