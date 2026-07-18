"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FILTERABLE_TAG_OPTIONS,
  normalizeDishTagFields,
  normalizeTagLabel,
} from "@/lib/dietary-tags";

interface CreatableTagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  suggestions?: readonly { tag: string; label?: string }[];
}

function commitTags(current: string[], nextRaw: string[]): string[] {
  return normalizeDishTagFields([...current, ...nextRaw], []).tags;
}

export function CreatableTagInput({
  value,
  onChange,
  disabled = false,
  placeholder = "Type a tag and press Enter",
  suggestions = FILTERABLE_TAG_OPTIONS,
}: CreatableTagInputProps) {
  const [input, setInput] = useState("");

  function addFromInput() {
    const cleaned = normalizeTagLabel(input);
    if (!cleaned) {
      setInput("");
      return;
    }
    onChange(commitTags(value, [cleaned]));
    setInput("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((entry) => entry.toLowerCase() !== tag.toLowerCase()));
  }

  function toggleSuggestion(tag: string) {
    if (value.some((entry) => entry.toLowerCase() === tag.toLowerCase())) {
      removeTag(tag);
      return;
    }
    onChange(commitTags(value, [tag]));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addFromInput();
      return;
    }
    if (event.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]!);
    }
  }

  const unusedSuggestions = suggestions.filter(
    (option) => !value.some((tag) => tag.toLowerCase() === option.tag.toLowerCase())
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
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-neutral-200/60 bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-800"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              disabled={disabled}
              className="inline-flex h-4 w-4 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-700"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
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
          placeholder={value.length === 0 ? placeholder : "Add another…"}
          className="min-w-[8rem] flex-1 border-0 bg-transparent px-1.5 py-1 text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
        />
      </div>

      {unusedSuggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {unusedSuggestions.map(({ tag, label }) => (
            <button
              key={tag}
              type="button"
              disabled={disabled}
              onClick={() => toggleSuggestion(tag)}
              className="rounded-full border border-neutral-200/70 bg-white px-3 py-1 text-xs font-medium text-neutral-500 transition-all hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-700 disabled:opacity-50"
            >
              + {label ?? tag}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
