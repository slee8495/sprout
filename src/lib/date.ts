export const FAMILY_TIMEZONE = "America/Los_Angeles";

export const BIRTH_DATE = "2026-04-15";

export function todayInFamilyTimezone(): { iso: string; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: FAMILY_TIMEZONE,
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

export function dayOfLife(entryDate: string): number {
  return Math.round((utcMidnight(entryDate) - utcMidnight(BIRTH_DATE)) / 86400000);
}

export function formatDayOfLife(entryDate: string): string {
  const n = dayOfLife(entryDate);
  return n >= 0 ? `+${n}` : String(n);
}

export function formatEntryTime(createdAt: Date | string): string {
  return new Date(createdAt).toLocaleTimeString("en-US", {
    timeZone: FAMILY_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
  });
}
