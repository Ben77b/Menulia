"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronRight, Loader2, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MAX_CATEGORY_NAME_LENGTH } from "@/lib/menu-limits";
import {
  MENU_CONTENT_LANGUAGES,
  type MenuContentLanguage,
} from "@/lib/menu-content-languages";
import {
  resolveBuilderSourceText,
  resolveBuilderTranslationText,
  type LocalizedTextValue,
} from "@/lib/localized-text";

const TRANSLATION_LANGUAGES = MENU_CONTENT_LANGUAGES.filter(
  (language) => language.code !== "en"
);

const translationInputClassName =
  "h-11 w-full rounded-xl border border-[#E5E5EA] bg-white px-4 text-sm text-slate-900 transition-all placeholder:text-[#86868B] focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:opacity-50";

interface LocalizedTitleEditorProps {
  name: LocalizedTextValue;
  disabled?: boolean;
  titleClassName?: string;
  onRename: (nextName: string) => Promise<boolean>;
  onTranslationChange: (lang: MenuContentLanguage, nextText: string) => Promise<void>;
}

export function LocalizedTitleEditor({
  name,
  disabled = false,
  titleClassName,
  onRename,
  onTranslationChange,
}: LocalizedTitleEditorProps) {
  const displayName = resolveBuilderSourceText(name);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [translationsOpen, setTranslationsOpen] = useState(false);
  const [translationDrafts, setTranslationDrafts] = useState<Record<string, string>>({});
  const [savingTranslationLang, setSavingTranslationLang] = useState<MenuContentLanguage | null>(
    null
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const hasSavedTranslations = TRANSLATION_LANGUAGES.some((language) =>
    resolveBuilderTranslationText(name, language.code).trim()
  );

  useEffect(() => {
    if (!editing) setDraft(displayName);
  }, [displayName, editing]);

  useEffect(() => {
    setTranslationDrafts(
      Object.fromEntries(
        TRANSLATION_LANGUAGES.map((language) => [
          language.code,
          resolveBuilderTranslationText(name, language.code),
        ])
      )
    );
  }, [name]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

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

  async function saveTranslation(lang: MenuContentLanguage) {
    const trimmed = (translationDrafts[lang] ?? "").trim();
    const saved = resolveBuilderTranslationText(name, lang).trim();
    if (trimmed === saved) return;

    setSavingTranslationLang(lang);
    try {
      await onTranslationChange(lang, trimmed);
    } finally {
      setSavingTranslationLang(null);
    }
  }

  return (
    <div className="min-w-0 flex-1 space-y-4">
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
            className={cn(translationInputClassName, "min-w-0 flex-1")}
            aria-label="English title"
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
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#E5E5EA] bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setTranslationsOpen((open) => !open)}
          disabled={disabled}
          aria-expanded={translationsOpen}
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#FAFAFA] disabled:opacity-50"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900">Manage Translations</p>
            <p className="mt-0.5 text-xs text-[#86868B]">
              {hasSavedTranslations
                ? "Custom translations saved"
                : "Add Spanish for the public menu"}
            </p>
          </div>
          <ChevronRight
            className={cn(
              "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ease-out",
              translationsOpen && "rotate-90"
            )}
          />
        </button>

        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-200 ease-out",
            translationsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}
        >
          <div className="overflow-hidden">
            <div className="space-y-4 border-t border-[#F0F0F0] px-4 py-4">
              {TRANSLATION_LANGUAGES.map((language) => (
                <div key={language.code} className="space-y-2">
                  <label
                    htmlFor={`translation-${language.code}`}
                    className="block text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {language.label} ({language.code.toUpperCase()})
                  </label>
                  <div className="relative">
                    <input
                      id={`translation-${language.code}`}
                      value={translationDrafts[language.code] ?? ""}
                      maxLength={MAX_CATEGORY_NAME_LENGTH}
                      disabled={disabled || savingTranslationLang === language.code}
                      onChange={(e) =>
                        setTranslationDrafts((prev) => ({
                          ...prev,
                          [language.code]: e.target.value,
                        }))
                      }
                      onBlur={() => void saveTranslation(language.code)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void saveTranslation(language.code);
                        }
                      }}
                      placeholder={`${language.label} title`}
                      className={translationInputClassName}
                    />
                    {savingTranslationLang === language.code && (
                      <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                    )}
                  </div>
                </div>
              ))}
              <p className="text-xs leading-relaxed text-[#86868B]">
                Saves automatically on blur or Enter. Overrides auto-translations on the public
                menu. The title above always edits English.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
