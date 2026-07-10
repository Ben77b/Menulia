"use client";

import { useState } from "react";
import { Globe, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { fetchMenuCategories } from "@/lib/menu-db";
import { flatRecordsToMenuTree } from "@/lib/menu-builder-tree";
import { translateMenuTreeToLanguage } from "@/lib/menu-translation";
import {
  MENU_CONTENT_LANGUAGES,
  getMenuContentLanguageMeta,
  getSecondaryLanguage,
  type MenuContentLanguage,
} from "@/lib/menu-content-languages";
import { saveRestaurantPrimaryLanguage } from "@/lib/restaurant-settings";
import { cn } from "@/lib/utils";

interface SettingsLanguagesPanelProps {
  restaurantId: string;
  restaurantName: string;
  primaryLanguage: MenuContentLanguage;
  onPrimaryLanguageChange: (language: MenuContentLanguage) => void;
  onPrimaryLanguageSaved: () => Promise<void>;
}

export function SettingsLanguagesPanel({
  restaurantId,
  restaurantName,
  primaryLanguage,
  onPrimaryLanguageChange,
  onPrimaryLanguageSaved,
}: SettingsLanguagesPanelProps) {
  const toast = useToast();
  const [translating, setTranslating] = useState(false);
  const [savingPrimary, setSavingPrimary] = useState(false);
  const [targetLanguages, setTargetLanguages] = useState<Set<MenuContentLanguage>>(() => new Set());

  const secondaryLanguage = getSecondaryLanguage(primaryLanguage);
  const translationTargets = MENU_CONTENT_LANGUAGES.filter(
    (language) => language.code !== primaryLanguage
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

  async function handleSavePrimaryLanguage() {
    setSavingPrimary(true);
    try {
      await saveRestaurantPrimaryLanguage(
        getSupabaseBrowserClient(),
        restaurantId,
        primaryLanguage
      );
      await onPrimaryLanguageSaved();
      toast.success("Primary menu language saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save primary language.");
    } finally {
      setSavingPrimary(false);
    }
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
      let tree = flatRecordsToMenuTree(records);
      const orderedTargets = [...targets].sort();

      for (const targetLang of orderedTargets) {
        tree = await translateMenuTreeToLanguage(tree, targetLang, {
          restaurantName,
          primaryLanguage,
        });
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
        <div className="mb-6 flex items-start gap-3">
          <Globe className="mt-0.5 h-5 w-5 shrink-0 text-gray-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Menu Languages</h2>
            <p className="mt-1 text-sm text-gray-600">
              Choose the primary language you write your menu in. The builder and public menu default
              to this language first.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="primary-menu-language" className="air-label">
              Idioma Principal del Menú / Primary Menu Language
            </label>
            <select
              id="primary-menu-language"
              value={primaryLanguage}
              onChange={(event) =>
                onPrimaryLanguageChange(event.target.value as MenuContentLanguage)
              }
              disabled={savingPrimary}
              className="air-select mt-1.5 max-w-md"
            >
              {MENU_CONTENT_LANGUAGES.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.flag} {language.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-[#86868B]">
              Secondary language for quick translations:{" "}
              {getMenuContentLanguageMeta(secondaryLanguage).label}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => void handleSavePrimaryLanguage()}
            disabled={savingPrimary}
          >
            {savingPrimary ? "Saving..." : "Save primary language"}
          </Button>
        </div>
      </div>

      <div className="air-card air-card-pad">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Auto-translate with DeepL</h2>
          <p className="mt-1 text-sm text-gray-600">
            DeepL detects each item automatically. Select only the languages you want to add — skip
            your primary language ({getMenuContentLanguageMeta(primaryLanguage).label}).
          </p>
        </div>

        <div className="mb-6">
          <p className="mb-3 text-sm font-medium text-gray-700">Translate into</p>
          <div className="flex flex-wrap gap-3">
            {translationTargets.map((language) => {
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
    </div>
  );
}
