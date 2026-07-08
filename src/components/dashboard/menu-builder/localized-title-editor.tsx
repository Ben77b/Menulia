"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Pencil, X } from "lucide-react";
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
    if (hasSavedTranslations) setTranslationsOpen(true);
  }, [hasSavedTranslations]);

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
    <div className="min-w-0 flex-1 space-y-3">
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
            className="air-input min-w-0 flex-1 py-1.5 text-sm"
            aria-label="Title"
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

      <div className="rounded-xl border border-[#F5F5F7] bg-[#FAFAFA]/80">
        <button
          type="button"
          onClick={() => setTranslationsOpen((open) => !open)}
          disabled={disabled}
          className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-[#F5F5F7]/80 disabled:opacity-50"
        >
          <span>🌐 Manage Translations</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-slate-400 transition-transform",
              translationsOpen && "rotate-180"
            )}
          />
        </button>

        {translationsOpen && (
          <div className="space-y-3 border-t border-[#F5F5F7] px-3 py-3">
            {TRANSLATION_LANGUAGES.map((language) => (
              <div key={language.code}>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  {language.label} Translation ({language.code.toUpperCase()})
                </label>
                <input
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
                  className="air-input py-1.5 text-sm"
                />
              </div>
            ))}
            <p className="text-xs text-[#86868B]">
              Overrides auto-translations for the public menu. The title field above always edits
              English.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
