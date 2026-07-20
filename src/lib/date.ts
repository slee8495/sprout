export type DayCountStart = "zero" | "one";

export const DEFAULT_TIMEZONE = "America/Los_Angeles";

export function todayInTimezone(timezone: string): { iso: string; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  return { iso: `${year}-${month}-${day}`, month: Number(month), day: Number(day) };
}

function utcMidnight(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function dayOfLife(entryDate: string, birthDate: string, dayCountStart: DayCountStart): number {
  const diff = Math.round((utcMidnight(entryDate) - utcMidnight(birthDate)) / 86400000);
  return dayCountStart === "one" ? diff + 1 : diff;
}

export function formatDayOfLife(entryDate: string, birthDate: string, dayCountStart: DayCountStart): string {
  const n = dayOfLife(entryDate, birthDate, dayCountStart);
  return n >= 0 ? `+${n}` : String(n);
}

export function formatEntryTime(createdAt: Date | string, timezone: string): string {
  return new Date(createdAt).toLocaleTimeString("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  });
}
