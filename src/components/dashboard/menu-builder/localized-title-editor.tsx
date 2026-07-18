"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_SECTION_TITLE } from "@/lib/menu-limits";
import {
  getMenuContentLanguageMeta,
  type MenuContentLanguage,
} from "@/lib/menu-content-languages";
import {
  resolveBuilderSourceText,
  type LocalizedTextValue,
} from "@/lib/localized-text";
import { SaveStatusIndicator, type SaveStatus } from "./save-status-indicator";

const fieldInputClassName =
  "h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:opacity-50";

interface LocalizedTitleEditorProps {
  name: LocalizedTextValue;
  primaryLanguage: MenuContentLanguage;
  disabled?: boolean;
  titleClassName?: string;
  maxLength?: number;
  showEditHint?: boolean;
  onRename: (nextName: string) => Promise<boolean>;
}

export interface LocalizedTitleEditorHandle {
  startEditing: () => void;
}

export const LocalizedTitleEditor = forwardRef<
  LocalizedTitleEditorHandle,
  LocalizedTitleEditorProps
>(function LocalizedTitleEditor(
  {
    name,
    primaryLanguage,
    disabled = false,
    titleClassName,
    maxLength = MAX_SECTION_TITLE,
    showEditHint = false,
    onRename,
  },
  ref
) {
  const primaryMeta = getMenuContentLanguageMeta(primaryLanguage);
  const displayName = resolveBuilderSourceText(name, primaryLanguage);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(displayName);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(displayName);
  }, [displayName, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useImperativeHandle(ref, () => ({
    startEditing: () => {
      if (!disabled) setEditing(true);
    },
  }));

  function cancelEdit() {
    setDraft(displayName);
    setEditing(false);
    setSaveStatus("idle");
  }

  async function saveEdit() {
    if (disabled || saveStatus === "saving") return;
    const trimmed = draft.trim();
    if (trimmed === displayName.trim()) {
      setEditing(false);
      return;
    }

    setSaveStatus("saving");
    try {
      const saved = await onRename(trimmed);
      if (saved) {
        setSaveStatus("saved");
        setEditing(false);
        window.setTimeout(() => setSaveStatus("idle"), 1100);
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
  }

  return (
    <div className="min-w-0 flex-1">
      <div className="flex min-w-0 items-center gap-1.5">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            maxLength={maxLength}
            disabled={disabled || saveStatus === "saving"}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => void saveEdit()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void saveEdit();
              }
              if (e.key === "Escape") cancelEdit();
            }}
            className={cn(fieldInputClassName, "min-w-0 flex-1")}
            aria-label={`${primaryMeta.label} title`}
          />
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setEditing(true)}
            aria-label={`Edit ${displayName || "title"}`}
            className={cn(
              "min-w-0 rounded-lg px-1 py-0.5 text-left transition-colors hover:bg-neutral-100 disabled:opacity-40",
              titleClassName
            )}
          >
            <span className="line-clamp-2 break-words">{displayName || "Untitled"}</span>
          </button>
        )}

        {showEditHint && !editing ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setEditing(true)}
            aria-label={`Edit ${displayName || "title"}`}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-40"
          >
            <Pencil className="h-4 w-4" />
          </button>
        ) : null}

        <SaveStatusIndicator status={saveStatus} />
      </div>
    </div>
  );
});
