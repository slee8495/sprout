"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addMeasurement, removeMeasurement } from "./actions";
import type { GrowthMeasurement } from "@/db/queries";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function GrowthForm({ measurements }: { measurements: GrowthMeasurement[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [measuredAt, setMeasuredAt] = useState(todayISO());
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!height.trim() && !weight.trim()) {
      setError("Enter a height or weight.");
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        await addMeasurement({
          measuredAt,
          heightCm: height.trim() ? Number(height) : undefined,
          weightKg: weight.trim() ? Number(weight) : undefined,
        });
        setHeight("");
        setWeight("");
        formRef.current?.reset();
        router.refresh();
      } catch {
        setError("Couldn't save that measurement — try again.");
      }
    });
  }

  function handleDelete(id: number) {
    if (!confirm("Delete this measurement?")) return;
    startTransition(async () => {
      await removeMeasurement(id);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-emerald-200 p-4 dark:border-emerald-900"
      >
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Date
          <input
            type="date"
            value={measuredAt}
            onChange={(e) => setMeasuredAt(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Height (cm)
          <input
            type="number"
            step="0.1"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="w-24 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-zinc-500">
          Weight (kg)
          <input
            type="number"
            step="0.01"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-24 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Add"}
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>

      {measurements.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-zinc-500">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Height (cm)</th>
                <th className="px-3 py-2">Weight (kg)</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {[...measurements].reverse().map((m) => (
                <tr key={m.id} className="border-t border-zinc-100 dark:border-zinc-900">
                  <td className="px-3 py-2">{m.measuredAt}</td>
                  <td className="px-3 py-2">{m.heightCm ?? "—"}</td>
                  <td className="px-3 py-2">{m.weightKg ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
