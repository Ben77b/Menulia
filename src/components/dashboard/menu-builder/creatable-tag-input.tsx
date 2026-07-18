"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FILTERABLE_TAG_OPTIONS,
  TAG_PASTEL_COLORS,
  encodeDishTag,
  normalizeDishTagFields,
  normalizeTagLabel,
  parseDishTag,
  type DishTagAppearance,
} from "@/lib/dietary-tags";

interface CreatableTagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  suggestions?: readonly { tag: string; label?: string }[];
}

function commitEncoded(current: string[], nextEncoded: string[]): string[] {
  return normalizeDishTagFields([...current, ...nextEncoded], []).tags;
}

export function CreatableTagInput({
  value,
  onChange,
  disabled = false,
  placeholder = "Type a tag and press Enter",
  suggestions = FILTERABLE_TAG_OPTIONS,
}: CreatableTagInputProps) {
  const [input, setInput] = useState("");
  const [editingLabel, setEditingLabel] = useState<string | null>(null);

  const appearances = value.map((raw) => parseDishTag(raw)).filter((tag) => tag.label);

  function addFromInput() {
    const cleaned = normalizeTagLabel(input);
    if (!cleaned) {
      setInput("");
      return;
    }
    const encoded = encodeDishTag(cleaned, "🏷️", TAG_PASTEL_COLORS[5]);
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

  function updateAppearance(current: DishTagAppearance, patch: Partial<Pick<DishTagAppearance, "icon" | "color">>) {
    const nextEncoded = encodeDishTag(
      current.label,
      patch.icon ?? current.icon,
      patch.color ?? current.color
    );
    onChange(
      value.map((entry) =>
        parseDishTag(entry).label.toLowerCase() === current.label.toLowerCase()
          ? nextEncoded
          : entry
      )
    );
  }

  function toggleSuggestion(tag: string) {
    const existing = appearances.find((entry) => entry.label.toLowerCase() === tag.toLowerCase());
    if (existing) {
      removeTag(existing.label);
      return;
    }
    const encoded = encodeDishTag(tag);
    onChange(commitEncoded(value, [encoded]));
    setEditingLabel(tag);
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

  const unusedSuggestions = suggestions.filter(
    (option) =>
      !appearances.some((tag) => tag.label.toLowerCase() === option.tag.toLowerCase())
  );

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
            className="inline-flex items-center gap-1 rounded-full border border-neutral-200/60 px-2.5 py-0.5 text-xs font-medium text-neutral-800 transition-all"
            style={{ backgroundColor: tag.color }}
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
              className="inline-flex h-4 w-4 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-black/5 hover:text-neutral-700"
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
        <div className="flex flex-col gap-2.5 rounded-xl border border-neutral-200/70 bg-neutral-50/70 p-3 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
            Style “{editing.label}”
          </p>
          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-500">Emoji</label>
            <input
              type="text"
              value={editing.icon}
              disabled={disabled}
              maxLength={8}
              onChange={(event) =>
                updateAppearance(editing, {
                  icon: event.target.value.trim() || "🏷️",
                })
              }
              className="h-9 w-14 rounded-lg border border-neutral-200/80 bg-white text-center text-base shadow-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-900/5"
              aria-label={`Emoji for ${editing.label}`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-500">Color</span>
            {TAG_PASTEL_COLORS.map((color) => {
              const selected = editing.color.toUpperCase() === color.toUpperCase();
              return (
                <button
                  key={color}
                  type="button"
                  disabled={disabled}
                  onClick={() => updateAppearance(editing, { color })}
                  className={cn(
                    "h-7 w-7 rounded-full border transition-all",
                    selected
                      ? "border-neutral-800 ring-2 ring-neutral-900/10"
                      : "border-neutral-200/80 hover:scale-105"
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={`Color ${color}`}
                />
              );
            })}
          </div>
        </div>
      ) : null}

      {unusedSuggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {unusedSuggestions.map(({ tag, label, icon }) => (
            <button
              key={tag}
              type="button"
              disabled={disabled}
              onClick={() => toggleSuggestion(tag)}
              className="rounded-full border border-neutral-200/70 bg-white px-3 py-1 text-xs font-medium text-neutral-500 transition-all hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-700 disabled:opacity-50"
            >
              + {icon} {label ?? tag}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
