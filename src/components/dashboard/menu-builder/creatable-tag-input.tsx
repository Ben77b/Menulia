"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FILTERABLE_TAG_OPTIONS,
  MAX_RESTAURANT_TAGS,
  encodeDishTag,
  isFilterableTag,
  normalizeDishTagFields,
  normalizeTagLabel,
  parseDishTag,
  type DishTagAppearance,
} from "@/lib/dietary-tags";

const TAG_CHIP_CLASS =
  "inline-flex items-center gap-1 rounded-full border border-neutral-200/80 bg-transparent px-2.5 py-0.5 text-xs font-medium text-neutral-600 transition-all duration-300 ease-out hover:scale-[1.02] hover:text-neutral-900 hover:opacity-80 hover:border-neutral-300 dark:border-white/20 dark:text-neutral-400 dark:hover:text-neutral-900 dark:hover:border-white/40";

const TAG_TEXT_CLASS =
  "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900";

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
  /** Defaults + custom unique tags across the restaurant */
  tagLibraryTotal?: number;
  tagLibraryAtLimit?: boolean;
  /** Permanently remove a custom tag from every dish in the restaurant */
  onDeleteMenuTag?: (label: string) => void | Promise<void>;
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
  tagLibraryTotal = 0,
  tagLibraryAtLimit = false,
  onDeleteMenuTag,
}: CreatableTagInputProps) {
  const [input, setInput] = useState("");
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [deletingLabel, setDeletingLabel] = useState<string | null>(null);

  const appearances = useMemo(
    () => value.map((raw) => parseDishTag(raw)).filter((tag) => tag.label),
    [value]
  );

  const selectedKeys = useMemo(
    () => new Set(appearances.map((tag) => tag.label.toLowerCase())),
    [appearances]
  );

  const libraryKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const option of FILTERABLE_TAG_OPTIONS) {
      keys.add(option.tag.toLowerCase());
    }
    for (const entry of menuSuggestions) {
      const label = entry.label ?? parseDishTag(entry.tag).label;
      if (label) keys.add(label.toLowerCase());
    }
    for (const tag of appearances) {
      keys.add(tag.label.toLowerCase());
    }
    return keys;
  }, [menuSuggestions, appearances]);

  const menuOnlySuggestions = useMemo(() => {
    const byKey = new Map<string, TagSuggestion>();
    for (const entry of menuSuggestions) {
      const parsed = parseDishTag(entry.tag);
      const label = entry.label ?? parsed.label;
      if (!label || isFilterableTag(label)) continue;
      const key = label.toLowerCase();
      byKey.set(key, {
        tag: parsed.encoded || entry.tag,
        label,
        icon: entry.icon ?? parsed.icon,
      });
    }
    return Array.from(byKey.values());
  }, [menuSuggestions]);

  const defaultSuggestions = useMemo(() => {
    return suggestions.filter((entry) => !selectedKeys.has(suggestionKey(entry)));
  }, [suggestions, selectedKeys]);

  function canCreateLabel(label: string): boolean {
    const key = label.toLowerCase();
    if (libraryKeys.has(key) || isFilterableTag(label)) return true;
    return !tagLibraryAtLimit;
  }

  function addFromInput() {
    const cleaned = normalizeTagLabel(input);
    if (!cleaned) {
      setInput("");
      return;
    }
    if (!canCreateLabel(cleaned)) {
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

  async function handleDeleteMenuTag(label: string) {
    if (!onDeleteMenuTag || isFilterableTag(label)) return;
    setDeletingLabel(label);
    try {
      await onDeleteMenuTag(label);
      removeTag(label);
    } catch {
      // Upstream rolls back menu state; keep this dish's draft unchanged.
    } finally {
      setDeletingLabel(null);
    }
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
  const createDisabled = disabled || tagLibraryAtLimit;

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
            className={cn(TAG_CHIP_CLASS, TAG_TEXT_CLASS)}
          >
            <span className={TAG_TEXT_CLASS}>{tag.icon}</span>
            <span className={TAG_TEXT_CLASS}>{tag.label}</span>
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
          disabled={createDisabled}
          maxLength={40}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (input.trim()) addFromInput();
          }}
          placeholder={
            tagLibraryAtLimit
              ? "Tag limit reached"
              : appearances.length === 0
                ? placeholder
                : "Add another…"
          }
          className="min-w-[8rem] flex-1 border-0 bg-transparent px-1.5 py-1 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed"
        />
      </div>

      {tagLibraryAtLimit ? (
        <p className="text-xs text-neutral-400">
          Tag limit reached ({Math.min(tagLibraryTotal, MAX_RESTAURANT_TAGS)}/{MAX_RESTAURANT_TAGS}).
          Delete an existing tag to create a new one.
        </p>
      ) : null}

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
            {menuOnlySuggestions.map((entry) => {
              const alreadySelected = selectedKeys.has((entry.label ?? "").toLowerCase());
              return (
              <div
                key={entry.tag}
                className={cn(
                  "group inline-flex items-center gap-1 rounded-full border border-neutral-200/80 bg-transparent px-2.5 py-1 text-xs font-medium transition-colors hover:border-neutral-300 dark:border-white/20",
                  TAG_TEXT_CLASS
                )}
              >
                <button
                  type="button"
                  disabled={disabled || deletingLabel === entry.label || alreadySelected}
                  onClick={() => addSuggestion(entry)}
                  className={cn(
                    "inline-flex items-center gap-1 disabled:opacity-50",
                    TAG_TEXT_CLASS
                  )}
                >
                  <span className={TAG_TEXT_CLASS}>{entry.icon}</span>
                  <span className={TAG_TEXT_CLASS}>{entry.label}</span>
                </button>
                {onDeleteMenuTag ? (
                  <button
                    type="button"
                    disabled={disabled || deletingLabel === entry.label}
                    onClick={() => void handleDeleteMenuTag(entry.label!)}
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full text-neutral-400 opacity-0 transition-all hover:bg-neutral-100 hover:text-neutral-700 group-hover:opacity-100"
                    aria-label={`Delete ${entry.label} from restaurant`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : null}
              </div>
              );
            })}
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
              className={cn(
                "rounded-full border border-neutral-200/80 bg-transparent px-3 py-1 text-xs font-medium transition-colors hover:border-neutral-300 dark:border-white/20 dark:hover:border-white/40 disabled:opacity-50",
                TAG_TEXT_CLASS
              )}
            >
              <span className={TAG_TEXT_CLASS}>
                + {icon} {label ?? tag}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
