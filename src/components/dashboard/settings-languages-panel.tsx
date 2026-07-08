"use client";

import { useMemo, useState } from "react";
import { Globe, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { fetchMenuCategories } from "@/lib/menu-db";
import { flatRecordsToMenuTree } from "@/lib/menu-builder-tree";
import { translateMenuTreeToLanguage } from "@/lib/menu-translation";
import { LANGUAGES } from "@/lib/languages";
import { cn } from "@/lib/utils";

const SOURCE_LANGUAGE = "en";

const TRANSLATION_TARGET_OPTIONS = [
  {
    code: "en",
    label: "English",
    flag: "🇬🇧",
    description: "Default source language for your menu content",
    locked: true,
  },
  {
    code: "es",
    label: "Spanish",
    flag: "🇪🇸",
    description: "Generate Spanish translations for sections, categories, and dishes",
    locked: false,
  },
] as const;

interface SettingsLanguagesPanelProps {
  restaurantId: string;
}

export function SettingsLanguagesPanel({ restaurantId }: SettingsLanguagesPanelProps) {
  const toast = useToast();
  const [translating, setTranslating] = useState(false);
  const [targetLanguages, setTargetLanguages] = useState<Set<string>>(new Set(["es"]));

  const sourceLanguage = useMemo(
    () => LANGUAGES.find((language) => language.code === SOURCE_LANGUAGE),
    []
  );

  function toggleTargetLanguage(code: string) {
    if (code === SOURCE_LANGUAGE) return;

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
    const targets = Array.from(targetLanguages).filter((code) => code !== SOURCE_LANGUAGE);
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
              Translate your menu content while keeping English as the source of truth.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Default Source Language
            </label>
            <select
              value={SOURCE_LANGUAGE}
              disabled
              className="air-input max-w-sm cursor-not-allowed bg-gray-50 text-gray-700"
            >
              <option value={SOURCE_LANGUAGE}>
                {sourceLanguage?.flag} {sourceLanguage?.label ?? "English"}
              </option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Menu Builder edits are saved in English. Additional languages are generated from this
              source.
            </p>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-gray-700">Target Languages</p>
            <div className="space-y-2">
              {TRANSLATION_TARGET_OPTIONS.map((option) => {
                const isChecked = option.locked || targetLanguages.has(option.code);

                return (
                  <label
                    key={option.code}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition-colors",
                      option.locked
                        ? "border-gray-200 bg-gray-50"
                        : isChecked
                          ? "border-slate-900/15 bg-slate-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={option.locked || translating}
                      onChange={() => toggleTargetLanguage(option.code)}
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{option.flag}</span>
                        <span className="text-sm font-medium text-gray-900">{option.label}</span>
                        {option.locked ? (
                          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                            Source
                          </span>
                        ) : isChecked ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                            Active
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{option.description}</p>
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
              DeepL will translate all section, category, and dish names and descriptions into your
              selected target languages.
            </p>
          </div>
          <Button
            variant="dark"
            className="gap-2 shrink-0"
            onClick={() => void handleTranslateMenu()}
            disabled={translating || !targetLanguages.has("es")}
          >
            {translating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Translate Menu to Spanish
          </Button>
        </div>
      </div>
    </div>
  );
}
