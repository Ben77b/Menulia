"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useSessionPersistedState } from "@/hooks/use-session-persisted-state";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { loadRestaurantSettings } from "@/lib/restaurant-settings";
import {
  EMPTY_SETTINGS_FORM_DRAFT,
  normalizeSettingsFormDraft,
  settingsDraftFromLoadedData,
  settingsDraftToSaveForm,
  type SettingsCustomLinkDraft,
  type SettingsFormDraft,
} from "@/lib/settings-form-draft";

export function useSettingsFormDraft(restaurantId: string | undefined) {
  const draftStorageKey = restaurantId ? `menulia:settings-draft:${restaurantId}` : null;
  const [formDraft, setFormDraft] = useSessionPersistedState<SettingsFormDraft>(
    draftStorageKey,
    EMPTY_SETTINGS_FORM_DRAFT,
    normalizeSettingsFormDraft
  );

  const patchDraft = useCallback(
    (patch: Partial<SettingsFormDraft>) => {
      setFormDraft((previous) => ({ ...previous, ...patch, dirty: true }));
    },
    [setFormDraft]
  );

  const loadDraftFromServer = useCallback(async () => {
    if (!restaurantId) return;

    try {
      const data = await loadRestaurantSettings(getSupabaseBrowserClient(), restaurantId);
      setFormDraft((previous) =>
        previous.dirty ? previous : settingsDraftFromLoadedData(data)
      );
    } catch (error) {
      console.error("[SettingsLoad:Failed]", error);
      throw error;
    }
  }, [restaurantId, setFormDraft]);

  useEffect(() => {
    if (!restaurantId) return;
    void loadDraftFromServer().catch(() => undefined);
  }, [restaurantId, loadDraftFromServer]);

  const livePreview = useMemo(
    () => ({
      restaurantName: formDraft.restaurantName,
      location: formDraft.restaurantLocation,
      phone: formDraft.restaurantPhone,
      email: formDraft.restaurantEmail,
      scheduleBlocks: formDraft.scheduleBlocks,
      footerSlogan: formDraft.footerSlogan,
      links: formDraft.customLinks,
    }),
    [formDraft]
  );

  const markDraftSaved = useCallback(
    (patch?: Partial<SettingsFormDraft>) => {
      setFormDraft((previous) => ({
        ...previous,
        ...patch,
        dirty: false,
      }));
    },
    [setFormDraft]
  );

  return {
    formDraft,
    patchDraft,
    setFormDraft,
    loadDraftFromServer,
    livePreview,
    markDraftSaved,
    saveForm: settingsDraftToSaveForm(formDraft),
    setScheduleBlocks: (scheduleBlocks: SettingsFormDraft["scheduleBlocks"]) =>
      patchDraft({ scheduleBlocks }),
    setCustomLinks: (customLinks: SettingsCustomLinkDraft[]) => patchDraft({ customLinks }),
  };
}

export type { SettingsFormDraft, SettingsCustomLinkDraft };
