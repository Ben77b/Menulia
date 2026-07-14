"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { SaveStatusIndicator, type SaveStatus } from "./save-status-indicator";

interface InlineSaveFieldProps {
  value: string;
  displayValue?: string;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  ariaLabel: string;
  textClassName?: string;
  inputClassName?: string;
  onSave: (nextValue: string) => Promise<boolean>;
  onClick?: (event: React.MouseEvent) => void;
}

export function InlineSaveField({
  value,
  displayValue,
  placeholder = "Untitled",
  disabled = false,
  maxLength,
  inputMode,
  ariaLabel,
  textClassName,
  inputClassName,
  onSave,
  onClick,
}: InlineSaveFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function beginEdit(event: React.MouseEvent) {
    onClick?.(event);
    if (disabled || editing) return;
    event.stopPropagation();
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(value);
    setEditing(false);
    setSaveStatus("idle");
  }

  async function commitEdit() {
    if (disabled) return;
    const trimmed = draft.trim();
    if (trimmed === value.trim()) {
      setEditing(false);
      return;
    }

    setSaveStatus("saving");
    try {
      const saved = await onSave(trimmed);
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

  if (editing) {
    return (
      <div className="flex min-w-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          value={draft}
          maxLength={maxLength}
          inputMode={inputMode}
          disabled={disabled || saveStatus === "saving"}
          aria-label={ariaLabel}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => void commitEdit()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void commitEdit();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              cancelEdit();
            }
          }}
          className={cn(
            "min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10",
            inputClassName
          )}
        />
        <SaveStatusIndicator status={saveStatus} />
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        onClick={beginEdit}
        className={cn(
          "min-w-0 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-slate-100/80 disabled:opacity-50",
          textClassName
        )}
      >
        <span className="line-clamp-2 break-words">{displayValue ?? (value || placeholder)}</span>
      </button>
      <SaveStatusIndicator status={saveStatus} />
    </div>
  );
}
