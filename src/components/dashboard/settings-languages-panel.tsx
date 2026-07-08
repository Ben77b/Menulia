"use client";

import { useState } from "react";
import { Globe, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { fetchMenuCategories } from "@/lib/menu-db";
import { flatRecordsToMenuTree } from "@/lib/menu-builder-tree";
import { translateMenuTreeToLanguage } from "@/lib/menu-translation";
import { MENU_CONTENT_LANGUAGES, type MenuContentLanguage } from "@/lib/menu-content-languages";
import { cn } from "@/lib/utils";

interface SettingsLanguagesPanelProps {
  restaurantId: string;
}

export function SettingsLanguagesPanel({ restaurantId }: SettingsLanguagesPanelProps) {
  const toast = useToast();
  const [translating, setTranslating] = useState(false);
  const [targetLanguages, setTargetLanguages] = useState<Set<MenuContentLanguage>>(
    () => new Set(["es"])
  );

  const hasTargets = targetLanguages.size > 0;

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
      toast.error("Select at least one language.");
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
    <div className="air-card air-card-pad">
      <div className="mb-6 flex items-start gap-3">
        <Globe className="mt-0.5 h-5 w-5 shrink-0 text-gray-600" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Menu Languages</h2>
          <p className="mt-1 text-sm text-gray-600">
            DeepL detects the language of each dish and category automatically, then generates
            guest-facing translations for the languages you select below.
          </p>
        </div>
      </div>

      <div className="mb-6">
        <p className="mb-3 text-sm font-medium text-gray-700">Translate into</p>
        <div className="flex flex-wrap gap-3">
          {MENU_CONTENT_LANGUAGES.map((language) => {
            const isChecked = targetLanguages.has(language.code);

            return (
              <label
                key={language.code}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  isChecked
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                )}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={translating}
                  onChange={() => toggleTargetLanguage(language.code)}
                  className="sr-only"
                />
                <span>{language.flag}</span>
                <span>{language.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <Button
        variant="dark"
        className="gap-2"
        onClick={() => void handleTranslateMenu()}
        disabled={translating || !hasTargets}
      >
        {translating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        Translate Menu
      </Button>
    </div>
  );
}
