"use client";

import { useState } from "react";
import { Globe, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useDashboardLocale } from "@/contexts/dashboard-locale-context";
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
import { DashboardSectionCard } from "@/components/dashboard/dashboard-section-card";

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
  const { t } = useDashboardLocale();
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
      toast.success(t("settings.primaryLanguageSaved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save primary language.");
    } finally {
      setSavingPrimary(false);
    }
  }

  async function handleTranslateMenu() {
    const targets = Array.from(targetLanguages);
    if (targets.length === 0) {
      toast.error(t("settings.selectLanguage"));
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

      toast.success(t("settings.translateSuccess"));
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
      <DashboardSectionCard
        title={t("settings.menuLanguagesTitle")}
        description={t("settings.menuLanguagesDescription")}
        icon={<Globe className="h-5 w-5" />}
      >
        <div>
          <p className="mb-3 text-sm font-medium text-slate-700">
            {t("settings.primaryMenuLanguage")}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {MENU_CONTENT_LANGUAGES.map((language) => {
              const selected = primaryLanguage === language.code;
              return (
                <button
                  key={language.code}
                  type="button"
                  disabled={savingPrimary}
                  onClick={() => onPrimaryLanguageChange(language.code)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200",
                    selected
                      ? "scale-[1.02] border-indigo-300 bg-indigo-50/80 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                    savingPrimary && "cursor-not-allowed opacity-60"
                  )}
                >
                  <span className="text-xl" aria-hidden>
                    {language.flag}
                  </span>
                  <span
                    className={cn(
                      "text-sm",
                      selected ? "font-medium text-indigo-900" : "text-slate-700"
                    )}
                  >
                    {language.label}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-slate-400">
            {t("settings.secondaryLanguage")}{" "}
            {getMenuContentLanguageMeta(secondaryLanguage).label}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => void handleSavePrimaryLanguage()}
          disabled={savingPrimary}
        >
          {savingPrimary ? t("common.saving") : t("settings.savePrimaryLanguage")}
        </Button>
      </DashboardSectionCard>

      <DashboardSectionCard
        title={t("settings.translateTitle")}
        description={t("settings.translateDescription", {
          language: getMenuContentLanguageMeta(primaryLanguage).label,
        })}
        icon={<Sparkles className="h-5 w-5" />}
      >
        <div>
          <p className="mb-3 text-sm font-medium text-slate-700">{t("settings.translateInto")}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {translationTargets.map((language) => {
              const isChecked = targetLanguages.has(language.code);

              return (
                <button
                  key={language.code}
                  type="button"
                  disabled={translating}
                  onClick={() => toggleTargetLanguage(language.code)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all duration-200",
                    isChecked
                      ? "scale-[1.02] border-indigo-300 bg-indigo-50/80 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <span className="text-lg" aria-hidden>
                    {language.flag}
                  </span>
                  <span
                    className={cn(
                      "text-xs leading-tight",
                      isChecked ? "font-medium text-indigo-900" : "text-slate-700"
                    )}
                  >
                    {language.label}
                  </span>
                </button>
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
          {t("settings.translateMenu")}
        </Button>
      </DashboardSectionCard>
    </div>
  );
}
