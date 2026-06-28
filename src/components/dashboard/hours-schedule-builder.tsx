"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  WEEKDAY_ABBR,
  compileHoursSchedule,
  newScheduleBlock,
  type HoursScheduleBlock,
  type WeekdayAbbr,
} from "@/lib/hours-schedule";

interface HoursScheduleBuilderProps {
  blocks: HoursScheduleBlock[];
  onChange: (blocks: HoursScheduleBlock[]) => void;
}

export function HoursScheduleBuilder({ blocks, onChange }: HoursScheduleBuilderProps) {
  function updateBlock(id: string, patch: Partial<HoursScheduleBlock>) {
    onChange(blocks.map((block) => (block.id === id ? { ...block, ...patch } : block)));
  }

  function toggleDay(blockId: string, day: WeekdayAbbr) {
    onChange(
      blocks.map((block) => {
        if (block.id !== blockId) return block;

        const hasDay = block.days.includes(day);
        return {
          ...block,
          days: hasDay ? block.days.filter((value) => value !== day) : [...block.days, day],
        };
      })
    );
  }

  function addBlock() {
    onChange([...blocks, newScheduleBlock(blocks.length + 1)]);
  }

  function removeBlock(id: string) {
    if (blocks.length === 1) return;
    onChange(blocks.filter((block) => block.id !== id));
  }

  const preview = compileHoursSchedule(blocks);

  return (
    <div className="space-y-4">
      {blocks.map((block) => (
        <div key={block.id} className="rounded-lg border border-gray-200 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <input
              type="time"
              value={block.startTime}
              onChange={(e) => updateBlock(block.id, { startTime: e.target.value })}
              className="h-10 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-500">to</span>
            <input
              type="time"
              value={block.endTime}
              onChange={(e) => updateBlock(block.id, { endTime: e.target.value })}
              className="h-10 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {blocks.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeBlock(block.id)}
                className="ml-auto text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {WEEKDAY_ABBR.map((day) => {
              const selected = block.days.includes(day);
              return (
                <label
                  key={day}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleDay(block.id, day)}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  {day}
                </label>
              );
            })}
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addBlock} className="gap-1">
        <Plus className="h-4 w-4" />
        Add Schedule Block
      </Button>

      {preview && (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Preview</p>
          <p className="mt-1 text-sm text-gray-800">{preview}</p>
        </div>
      )}
    </div>
  );
}
