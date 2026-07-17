"use client";

import { useRouter } from "next/navigation";

export function YearSelect({ year, years }: { year: string; years: string[] }) {
  const router = useRouter();

  return (
    <select
      value={year}
      onChange={(e) => router.push(`/photobook?year=${e.target.value}`)}
      className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
    >
      {years.map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
  );
}
