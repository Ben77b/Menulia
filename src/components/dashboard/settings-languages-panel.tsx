"use client";

import { useEffect, useMemo, useState } from "react";
import { Globe, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { fetchMenuCategories } from "@/lib/menu-db";
import { flatRecordsToMenuTree } from "@/lib/menu-builder-tree";
import { translateMenuTreeToLanguage } from "@/lib/menu-translation";
import {
  getMenuContentLanguageMeta,
  getMenuEditorLanguage,
  MENU_CONTENT_LANGUAGES,
  setMenuEditorLanguage,
  type MenuContentLanguage,
} from "@/lib/menu-content-languages";
import { cn } from "@/lib/utils";

interface SettingsLanguagesPanelProps {
  restaurantId: string;
}

export function SettingsLanguagesPanel({ restaurantId }: SettingsLanguagesPanelProps) {
  const toast = useToast();
  const [translating, setTranslating] = useState(false);
  const [editorLanguage, setEditorLanguage] = useState<MenuContentLanguage>(() =>
    getMenuEditorLanguage(restaurantId)
  );
  const [targetLanguages, setTargetLanguages] = useState<Set<MenuContentLanguage>>(
    () => new Set(["es"])
  );

  useEffect(() => {
    setEditorLanguage(getMenuEditorLanguage(restaurantId));
  }, [restaurantId]);

  const editorMeta = useMemo(
    () => getMenuContentLanguageMeta(editorLanguage),
    [editorLanguage]
  );

  const activeTargets = useMemo(
    () => MENU_CONTENT_LANGUAGES.filter((language) => targetLanguages.has(language.code)),
    [targetLanguages]
  );

  function handleEditorLanguageChange(nextLanguage: MenuContentLanguage) {
    setEditorLanguage(nextLanguage);
    setMenuEditorLanguage(restaurantId, nextLanguage);
  }

  function toggleTargetLanguage(code: MenuContentLanguage) {
    setTargetLanguages((current) => {
      const next = new Set(current);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }

  async function handleTranslateMenu() {
    const targets = Array.from(targetLanguages);
    if (targets.length === 0) {
      toast.error("Select at least one target language.");
      return;
    }

    setTranslating(true);
    try {
      const records = await fetchMenuCategories(restaurantId);
      const tree = flatRecordsToMenuTree(records);

      for (const targetLang of targets) {
        await translateMenuTreeToLanguage(tree, targetLang);
      }

      toast.success("✨ Menu translated successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not translate your menu. Try again.";
      toast.error(message);
    } finally {
      setTranslating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="air-card air-card-pad">
        <div className="mb-4 flex items-center gap-3">
          <Globe className="h-5 w-5 text-gray-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Menu Languages</h2>
            <p className="text-sm text-gray-600">
              DeepL automatically detects each item&apos;s language when translating. Mixed
              English and Spanish menus are supported.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label
              htmlFor="menu-editor-language"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Menu Builder Edit Language
            </label>
            <select
              id="menu-editor-language"
              value={editorLanguage}
              disabled={translating}
              onChange={(event) =>
                handleEditorLanguageChange(event.target.value as MenuContentLanguage)
              }
              className="air-input max-w-sm"
            >
              {MENU_CONTENT_LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.flag} {language.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              New edits in Menu Builder are saved under {editorMeta.label}. This does not affect
              automatic translation detection.
            </p>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-gray-700">Target Languages</p>
            <div className="space-y-2">
              {MENU_CONTENT_LANGUAGES.map((language) => {
                const isChecked = targetLanguages.has(language.code);

                return (
                  <label
                    key={language.code}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition-colors",
                      isChecked
                        ? "border-slate-900/15 bg-slate-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={translating}
                      onChange={() => toggleTargetLanguage(language.code)}
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{language.flag}</span>
                        <span className="text-sm font-medium text-gray-900">{language.label}</span>
                        {isChecked ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                            Active
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Generate {language.label} guest-facing translations
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="air-card air-card-pad">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Generate Translations</h3>
            <p className="mt-1 text-sm text-gray-600">
              DeepL reads each section, category, and dish name or description, detects its
              language automatically, and writes translations into your selected target languages.
            </p>
          </div>
          <Button
            variant="dark"
            className="gap-2 shrink-0"
            onClick={() => void handleTranslateMenu()}
            disabled={translating || activeTargets.length === 0}
          >
            {translating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Translate Menu
          </Button>
        </div>
      </div>
    </div>
  );
}
