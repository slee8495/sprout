"use client";

import { fill } from "@/lib/i18n";
import { formatBytes } from "@/lib/storage";
import { useSettings } from "../SettingsProvider";

export function StorageCard({ usedBytes, quotaBytes }: { usedBytes: number; quotaBytes: number }) {
  const { t } = useSettings();
  const pct = Math.min(100, Math.round((usedBytes / quotaBytes) * 100));
  const isFull = usedBytes >= quotaBytes;

  return (
    <section className="flex flex-col gap-2 rounded-3xl border border-emerald-200/70 bg-white p-4 dark:border-emerald-800/50 dark:bg-zinc-900">
      <h2 className="font-heading text-sm font-semibold text-emerald-800 dark:text-emerald-200">{t("Storage")}</h2>
      <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-50 dark:bg-emerald-950/40">
        <div
          className={`h-full rounded-full ${isFull ? "bg-rose-500" : "bg-emerald-600"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        {fill(t("{used} / {quota} used"), { used: formatBytes(usedBytes), quota: formatBytes(quotaBytes) })}
        {isFull && ` ${t("— delete some photos to free up space")}`}
      </p>
    </section>
  );
}
