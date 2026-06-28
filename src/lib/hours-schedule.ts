export const WEEKDAY_ABBR = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export type WeekdayAbbr = (typeof WEEKDAY_ABBR)[number];

export interface HoursScheduleBlock {
  id: string;
  days: WeekdayAbbr[];
  startTime: string;
  endTime: string;
}

const DAY_INDEX: Record<WeekdayAbbr, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

export function defaultScheduleBlocks(): HoursScheduleBlock[] {
  return [
    {
      id: "1",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      startTime: "09:00",
      endTime: "22:00",
    },
  ];
}

export function newScheduleBlock(index: number): HoursScheduleBlock {
  return {
    id: `${Date.now()}-${index}`,
    days: ["Sat", "Sun"],
    startTime: "10:00",
    endTime: "23:00",
  };
}

function formatDayGroups(days: WeekdayAbbr[]): string {
  if (days.length === 0) return "";

  const sorted = [...new Set(days)].sort((a, b) => DAY_INDEX[a] - DAY_INDEX[b]);
  const groups: string[] = [];
  let groupStart = sorted[0];
  let groupEnd = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const day = sorted[i];
    if (DAY_INDEX[day] === DAY_INDEX[groupEnd] + 1) {
      groupEnd = day;
      continue;
    }

    groups.push(groupStart === groupEnd ? groupStart : `${groupStart}-${groupEnd}`);
    groupStart = day;
    groupEnd = day;
  }

  groups.push(groupStart === groupEnd ? groupStart : `${groupStart}-${groupEnd}`);
  return groups.join(", ");
}

export function compileHoursSchedule(blocks: HoursScheduleBlock[]): string {
  return blocks
    .filter((block) => block.days.length > 0)
    .map((block) => `${formatDayGroups(block.days)}: ${block.startTime}-${block.endTime}`)
    .join(", ");
}

function expandDayToken(token: string): WeekdayAbbr[] {
  const trimmed = token.trim();
  if (!trimmed) return [];

  if (trimmed.includes("-")) {
    const [fromRaw, toRaw] = trimmed.split("-").map((part) => part.trim());
    const from = fromRaw as WeekdayAbbr;
    const to = toRaw as WeekdayAbbr;
    const fromIdx = DAY_INDEX[from];
    const toIdx = DAY_INDEX[to];

    if (fromIdx === undefined || toIdx === undefined || fromIdx > toIdx) {
      return [];
    }

    return WEEKDAY_ABBR.slice(fromIdx, toIdx + 1);
  }

  return WEEKDAY_ABBR.includes(trimmed as WeekdayAbbr) ? [trimmed as WeekdayAbbr] : [];
}

function expandDayPart(part: string): WeekdayAbbr[] {
  const days: WeekdayAbbr[] = [];

  for (const segment of part.split(",")) {
    days.push(...expandDayToken(segment));
  }

  return [...new Set(days)];
}

export function parseHoursSchedule(text: string | null | undefined): HoursScheduleBlock[] | null {
  const trimmed = text?.trim();
  if (!trimmed) return null;

  const segments = trimmed.split(/,\s*(?=[A-Za-z])/).filter(Boolean);
  const blocks: HoursScheduleBlock[] = [];

  segments.forEach((segment, index) => {
    const match = segment.match(/^(.+?):\s*(\d{2}:\d{2})-(\d{2}:\d{2})$/);
    if (!match) return;

    const days = expandDayPart(match[1].trim());
    if (days.length === 0) return;

    blocks.push({
      id: String(index + 1),
      days,
      startTime: match[2],
      endTime: match[3],
    });
  });

  return blocks.length > 0 ? blocks : null;
}
