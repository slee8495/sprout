"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DayCountStart } from "@/lib/date";
import { subjectEmoji, type SubjectType } from "@/lib/milestones";
import { useSettings } from "../SettingsProvider";
import { ChildForm } from "./ChildForm";
import { addChild, editChild } from "./actions";

export type ChildSummary = {
  id: number;
  name: string;
  type: SubjectType;
  birthDate: string | null;
  dayCountStart: DayCountStart;
};

export function ChildrenCard({ kids }: { kids: ChildSummary[] }) {
  const router = useRouter();
  const { t } = useSettings();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-emerald-200/70 bg-white p-4 dark:border-emerald-800/50 dark:bg-zinc-900">
      <h2 className="font-heading text-sm font-semibold text-emerald-800 dark:text-emerald-200">
        {t("Kids & Pets")}
      </h2>

      {kids.map((child) =>
        editingId === child.id ? (
          <ChildForm
            key={child.id}
            initial={{
              name: child.name,
              type: child.type,
              birthDate: child.birthDate ?? "",
              dayCountStart: child.dayCountStart,
            }}
            submitLabel={t("Save")}
            onCancel={() => setEditingId(null)}
            onSubmit={async (input) => {
              await editChild(child.id, input);
              setEditingId(null);
              router.refresh();
            }}
          />
        ) : (
          <div
            key={child.id}
            className="flex items-center justify-between rounded-2xl border border-emerald-100 px-3 py-2 text-sm dark:border-emerald-900/40"
          >
            <span className="font-semibold text-emerald-900 dark:text-emerald-100">
              {subjectEmoji(child.type)} {child.name}
            </span>
            <button
              type="button"
              onClick={() => setEditingId(child.id)}
              className="text-xs text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300"
            >
              {t("Edit")}
            </button>
          </div>
        ),
      )}

      {adding ? (
        <ChildForm
          submitLabel={t("Add")}
          onCancel={() => setAdding(false)}
          onSubmit={async (input) => {
            await addChild(input);
            setAdding(false);
            router.refresh();
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="self-start rounded-full border border-emerald-600 px-4 py-1.5 font-heading text-sm font-semibold text-emerald-700 transition-transform hover:scale-105 active:scale-95 dark:text-emerald-300"
        >
          {t("+ Add a kid or pet")}
        </button>
      )}
    </section>
  );
}
