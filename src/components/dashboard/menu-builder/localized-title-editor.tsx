"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_SECTION_TITLE } from "@/lib/menu-limits";
import {
  getMenuContentLanguageMeta,
  getSecondaryLanguage,
  type MenuContentLanguage,
} from "@/lib/menu-content-languages";
import {
  resolveBuilderSourceText,
  resolveBuilderTranslationText,
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
  onRename: (nextName: string) => Promise<boolean>;
  onTranslationChange: (lang: MenuContentLanguage, nextText: string) => Promise<void>;
}

export function LocalizedTitleEditor({
  name,
  primaryLanguage,
  disabled = false,
  titleClassName,
  maxLength = MAX_SECTION_TITLE,
  onRename,
  onTranslationChange,
}: LocalizedTitleEditorProps) {
  const secondaryLanguage = getSecondaryLanguage(primaryLanguage);
  const primaryMeta = getMenuContentLanguageMeta(primaryLanguage);
  const secondaryMeta = getMenuContentLanguageMeta(secondaryLanguage);

  const displayName = resolveBuilderSourceText(name, primaryLanguage);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(displayName);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [translationDraft, setTranslationDraft] = useState("");
  const [savingTranslation, setSavingTranslation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editing) setDraft(displayName);
  }, [displayName, editing]);

  useEffect(() => {
    setTranslationDraft(resolveBuilderTranslationText(name, secondaryLanguage));
  }, [name, secondaryLanguage]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (!popoverOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!popoverRef.current?.contains(event.target as Node)) {
        setPopoverOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [popoverOpen]);

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

  async function saveTranslation() {
    const trimmed = translationDraft.trim();
    const saved = resolveBuilderTranslationText(name, secondaryLanguage).trim();
    if (trimmed === saved) return;

    setSavingTranslation(true);
    try {
      await onTranslationChange(secondaryLanguage, trimmed);
    } finally {
      setSavingTranslation(false);
    }
  }

  const hasTranslation = Boolean(resolveBuilderTranslationText(name, secondaryLanguage).trim());

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
              "min-w-0 rounded-lg px-1 py-0.5 text-left transition-colors hover:bg-white/60 disabled:opacity-40",
              titleClassName
            )}
          >
            <span className="line-clamp-2 break-words">{displayName || "Untitled"}</span>
          </button>
        )}

        <SaveStatusIndicator status={saveStatus} />

        <div className="relative shrink-0" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setPopoverOpen((open) => !open)}
            disabled={disabled}
            aria-label={`Manage ${secondaryMeta.label} translation`}
            aria-expanded={popoverOpen}
            className={cn(
              "inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg transition-colors hover:bg-white/70 disabled:opacity-40",
              hasTranslation ? "text-slate-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Globe className="h-3.5 w-3.5" />
          </button>

          {popoverOpen && (
            <div className="absolute left-0 top-full z-30 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {secondaryMeta.label} ({secondaryLanguage.toUpperCase()})
              </p>
              <div className="relative mt-2">
                <input
                  value={translationDraft}
                  maxLength={maxLength}
                  disabled={disabled || savingTranslation}
                  onChange={(e) => setTranslationDraft(e.target.value)}
                  onBlur={() => void saveTranslation()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void saveTranslation();
                      setPopoverOpen(false);
                    }
                    if (e.key === "Escape") setPopoverOpen(false);
                  }}
                  placeholder={`${secondaryMeta.label} title`}
                  className={fieldInputClassName}
                />
                {savingTranslation && (
                  <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                )}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                Saves on blur or Enter. Tap the title to edit {primaryMeta.label}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
