"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Globe, Loader2, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MAX_CATEGORY_NAME_LENGTH } from "@/lib/menu-limits";
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

const fieldInputClassName =
  "h-11 w-full rounded-xl border border-[#E5E5EA] bg-white px-4 text-sm text-slate-900 transition-all placeholder:text-[#86868B] focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:opacity-50";

interface LocalizedTitleEditorProps {
  name: LocalizedTextValue;
  primaryLanguage: MenuContentLanguage;
  disabled?: boolean;
  titleClassName?: string;
  onRename: (nextName: string) => Promise<boolean>;
  onTranslationChange: (lang: MenuContentLanguage, nextText: string) => Promise<void>;
}

export function LocalizedTitleEditor({
  name,
  primaryLanguage,
  disabled = false,
  titleClassName,
  onRename,
  onTranslationChange,
}: LocalizedTitleEditorProps) {
  const secondaryLanguage = getSecondaryLanguage(primaryLanguage);
  const primaryMeta = getMenuContentLanguageMeta(primaryLanguage);
  const secondaryMeta = getMenuContentLanguageMeta(secondaryLanguage);

  const displayName = resolveBuilderSourceText(name, primaryLanguage);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(displayName);
  const [saving, setSaving] = useState(false);
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
  }

  async function saveEdit() {
    if (saving) return;
    setSaving(true);
    try {
      const saved = await onRename(draft);
      if (saved) setEditing(false);
    } finally {
      setSaving(false);
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
      {editing ? (
        <div className="flex min-w-0 items-center gap-2">
          <input
            ref={inputRef}
            value={draft}
            maxLength={MAX_CATEGORY_NAME_LENGTH}
            disabled={disabled || saving}
            onChange={(e) => setDraft(e.target.value)}
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
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="shrink-0 text-emerald-600 hover:text-emerald-700"
            onClick={() => void saveEdit()}
            disabled={disabled || saving}
            aria-label="Save title"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="shrink-0 text-slate-500 hover:text-slate-700"
            onClick={cancelEdit}
            disabled={saving}
            aria-label="Cancel title edit"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={cn("truncate", titleClassName)}>{displayName || "Untitled"}</span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            disabled={disabled}
            aria-label={`Rename ${displayName || "title"}`}
            className="rounded-lg p-1 text-[#C7C7CC] transition-colors hover:bg-[#F5F5F7] hover:text-slate-600 disabled:opacity-40"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>

          <div className="relative" ref={popoverRef}>
            <button
              type="button"
              onClick={() => setPopoverOpen((open) => !open)}
              disabled={disabled}
              aria-label={`Manage ${secondaryMeta.label} translation`}
              aria-expanded={popoverOpen}
              className={cn(
                "rounded-lg p-1 transition-colors hover:bg-[#F5F5F7] disabled:opacity-40",
                hasTranslation ? "text-slate-600" : "text-[#C7C7CC] hover:text-slate-600"
              )}
            >
              <Globe className="h-3.5 w-3.5" />
            </button>

            {popoverOpen && (
              <div className="absolute left-0 top-full z-30 mt-2 w-72 rounded-2xl border border-[#E5E5EA] bg-white p-4 shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {secondaryMeta.label} ({secondaryLanguage.toUpperCase()})
                </p>
                <div className="relative mt-2">
                  <input
                    value={translationDraft}
                    maxLength={MAX_CATEGORY_NAME_LENGTH}
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
                <p className="mt-2 text-[11px] leading-relaxed text-[#86868B]">
                  Saves on blur or Enter. Primary field edits {primaryMeta.label}.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
