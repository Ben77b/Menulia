export interface OperatingTimeSlot {
  id: string;
  startTime: string;
  endTime: string;
}

export interface OperatingHourData {
  day: string;
  isOpen: boolean;
  slots: OperatingTimeSlot[];
}

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export function defaultOperatingHours(): OperatingHourData[] {
  return WEEKDAYS.map((day) => ({
    day,
    isOpen: true,
    slots: [{ id: `${day}-1`, startTime: "09:00", endTime: "22:00" }],
  }));
}

export function normalizeOperatingHours(raw: unknown): OperatingHourData[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return defaultOperatingHours();
  }

  return raw.map((item: Record<string, unknown>, index: number) => {
    const day = typeof item.day === "string" ? item.day : WEEKDAYS[index] ?? "Monday";
    const isOpen = item.isOpen !== false;

    if (Array.isArray(item.slots) && item.slots.length > 0) {
      return {
        day,
        isOpen,
        slots: item.slots.map((slot: Record<string, unknown>, slotIndex: number) => ({
          id: typeof slot.id === "string" ? slot.id : `${day}-${slotIndex + 1}`,
          startTime: typeof slot.startTime === "string" ? slot.startTime : "09:00",
          endTime: typeof slot.endTime === "string" ? slot.endTime : "22:00",
        })),
      };
    }

    return {
      day,
      isOpen,
      slots:
        isOpen && typeof item.startTime === "string" && typeof item.endTime === "string"
          ? [{ id: `${day}-1`, startTime: item.startTime, endTime: item.endTime }]
          : isOpen
            ? [{ id: `${day}-1`, startTime: "09:00", endTime: "22:00" }]
            : [],
    };
  });
}

export function formatOperatingHoursDisplay(hours: OperatingHourData[]): string {
  return hours
    .map((day) => {
      if (!day.isOpen || day.slots.length === 0) {
        return `${day.day}: Closed`;
      }

      const ranges = day.slots
        .map((slot) => `${slot.startTime} – ${slot.endTime}`)
        .join(", ");

      return `${day.day}: ${ranges}`;
    })
    .join("\n");
}

export function newTimeSlot(day: string, index: number): OperatingTimeSlot {
  return {
    id: `${day}-${Date.now()}-${index}`,
    startTime: "09:00",
    endTime: "17:00",
  };
}
