"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FILTERABLE_TAG_OPTIONS,
  encodeDishTag,
  normalizeDishTagFields,
  normalizeTagLabel,
  parseDishTag,
  type DishTagAppearance,
} from "@/lib/dietary-tags";

const TAG_CHIP_CLASS =
  "inline-flex items-center gap-1 rounded-full border border-neutral-200/80 bg-transparent px-2.5 py-0.5 text-xs font-medium text-neutral-900 transition-colors hover:border-neutral-300 dark:border-white/20 dark:text-white dark:hover:border-white/40";

interface TagSuggestion {
  tag: string;
  label?: string;
  icon?: string;
}

interface CreatableTagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Built-in dietary defaults */
  suggestions?: readonly TagSuggestion[];
  /** Unique tags already used elsewhere on this restaurant menu */
  menuSuggestions?: readonly TagSuggestion[];
}

function commitEncoded(current: string[], nextEncoded: string[]): string[] {
  return normalizeDishTagFields([...current, ...nextEncoded], []).tags;
}

function suggestionKey(entry: TagSuggestion): string {
  return (entry.label ?? parseDishTag(entry.tag).label).toLowerCase();
}

export function CreatableTagInput({
  value,
  onChange,
  disabled = false,
  placeholder = "Type a tag and press Enter",
  suggestions = FILTERABLE_TAG_OPTIONS,
  menuSuggestions = [],
}: CreatableTagInputProps) {
  const [input, setInput] = useState("");
  const [editingLabel, setEditingLabel] = useState<string | null>(null);

  const appearances = useMemo(
    () => value.map((raw) => parseDishTag(raw)).filter((tag) => tag.label),
    [value]
  );

  const selectedKeys = useMemo(
    () => new Set(appearances.map((tag) => tag.label.toLowerCase())),
    [appearances]
  );

  const menuOnlySuggestions = useMemo(() => {
    const byKey = new Map<string, TagSuggestion>();
    for (const entry of menuSuggestions) {
      const parsed = parseDishTag(entry.tag);
      const label = entry.label ?? parsed.label;
      if (!label) continue;
      const key = label.toLowerCase();
      if (selectedKeys.has(key)) continue;
      byKey.set(key, {
        tag: parsed.encoded || entry.tag,
        label,
        icon: entry.icon ?? parsed.icon,
      });
    }
    return Array.from(byKey.values());
  }, [menuSuggestions, selectedKeys]);

  const defaultSuggestions = useMemo(() => {
    const menuKeys = new Set(menuOnlySuggestions.map((entry) => suggestionKey(entry)));
    return suggestions.filter((entry) => {
      const key = suggestionKey(entry);
      return !selectedKeys.has(key) && !menuKeys.has(key);
    });
  }, [suggestions, menuOnlySuggestions, selectedKeys]);

  function addFromInput() {
    const cleaned = normalizeTagLabel(input);
    if (!cleaned) {
      setInput("");
      return;
    }
    const encoded = encodeDishTag(cleaned, "🏷️");
    onChange(commitEncoded(value, [encoded]));
    setInput("");
    setEditingLabel(cleaned);
  }

  function removeTag(label: string) {
    onChange(
      value.filter((entry) => parseDishTag(entry).label.toLowerCase() !== label.toLowerCase())
    );
    if (editingLabel?.toLowerCase() === label.toLowerCase()) {
      setEditingLabel(null);
    }
  }

  function updateIcon(current: DishTagAppearance, icon: string) {
    const nextEncoded = encodeDishTag(current.label, icon || "🏷️");
    onChange(
      value.map((entry) =>
        parseDishTag(entry).label.toLowerCase() === current.label.toLowerCase()
          ? nextEncoded
          : entry
      )
    );
  }

  function addSuggestion(entry: TagSuggestion) {
    const parsed = parseDishTag(entry.tag);
    const encoded = parsed.encoded || encodeDishTag(entry.label ?? entry.tag, entry.icon);
    if (!encoded) return;
    onChange(commitEncoded(value, [encoded]));
    setEditingLabel(parsed.label || entry.label || null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addFromInput();
      return;
    }
    if (event.key === "Backspace" && !input && appearances.length > 0) {
      removeTag(appearances[appearances.length - 1]!.label);
    }
  }

  const editing = appearances.find(
    (tag) => tag.label.toLowerCase() === (editingLabel ?? "").toLowerCase()
  );

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-neutral-200/80 bg-white px-2.5 py-2 shadow-sm transition-all",
          "focus-within:border-neutral-300 focus-within:ring-2 focus-within:ring-neutral-900/5",
          disabled && "opacity-60"
        )}
      >
        {appearances.map((tag) => (
          <button
            key={tag.label}
            type="button"
            disabled={disabled}
            onClick={() =>
              setEditingLabel((current) =>
                current?.toLowerCase() === tag.label.toLowerCase() ? null : tag.label
              )
            }
            className={TAG_CHIP_CLASS}
          >
            <span>{tag.icon}</span>
            <span>{tag.label}</span>
            <span
              role="button"
              tabIndex={-1}
              onClick={(event) => {
                event.stopPropagation();
                removeTag(tag.label);
              }}
              className="inline-flex h-4 w-4 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100/80 hover:text-neutral-700"
              aria-label={`Remove ${tag.label}`}
            >
              <X className="h-3 w-3" />
            </span>
          </button>
        ))}
        <input
          type="text"
          value={input}
          disabled={disabled}
          maxLength={40}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (input.trim()) addFromInput();
          }}
          placeholder={appearances.length === 0 ? placeholder : "Add another…"}
          className="min-w-[8rem] flex-1 border-0 bg-transparent px-1.5 py-1 text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
        />
      </div>

      {editing ? (
        <div className="flex items-center gap-2 rounded-xl border border-neutral-200/70 bg-transparent px-3 py-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
            Emoji
          </p>
          <input
            type="text"
            value={editing.icon}
            disabled={disabled}
            maxLength={8}
            onChange={(event) => updateIcon(editing, event.target.value.trim() || "🏷️")}
            className="h-9 w-14 rounded-lg border border-neutral-200/80 bg-white text-center text-base shadow-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-900/5"
            aria-label={`Emoji for ${editing.label}`}
          />
          <span className="text-xs text-neutral-400">for “{editing.label}”</span>
        </div>
      ) : null}

      {menuOnlySuggestions.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
            Suggested tags
          </p>
          <div className="flex flex-wrap gap-2">
            {menuOnlySuggestions.map((entry) => (
              <button
                key={entry.tag}
                type="button"
                disabled={disabled}
                onClick={() => addSuggestion(entry)}
                className="rounded-full border border-neutral-200/80 bg-transparent px-3 py-1 text-xs font-medium text-neutral-900 transition-colors hover:border-neutral-300 dark:border-white/20 dark:text-white dark:hover:border-white/40 disabled:opacity-50"
              >
                {entry.icon} {entry.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {defaultSuggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {defaultSuggestions.map(({ tag, label, icon }) => (
            <button
              key={tag}
              type="button"
              disabled={disabled}
              onClick={() => addSuggestion({ tag, label, icon })}
              className="rounded-full border border-neutral-200/80 bg-transparent px-3 py-1 text-xs font-medium text-neutral-500 transition-colors hover:border-neutral-300 hover:text-neutral-900 dark:border-white/20 dark:text-white/70 dark:hover:border-white/40 dark:hover:text-white disabled:opacity-50"
            >
              + {icon} {label ?? tag}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
