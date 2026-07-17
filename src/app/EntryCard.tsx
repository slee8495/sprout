"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { JournalEntryWithPhotos } from "@/db/queries";
import { MILESTONE_LABELS, MILESTONE_OPTIONS, formatEntryDate } from "@/lib/milestones";
import { deleteEntry, updateEntry } from "./actions";
import { CommentThread } from "./CommentThread";
import type { milestoneEnum } from "@/db/schema";

type MilestoneType = (typeof milestoneEnum.enumValues)[number];

export function EntryCard({ entry }: { entry: JournalEntryWithPhotos }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [entryDate, setEntryDate] = useState(entry.entryDate);
  const [title, setTitle] = useState(entry.title ?? "");
  const [body, setBody] = useState(entry.body);
  const [milestoneType, setMilestoneType] = useState(entry.milestoneType ?? "");
  const [milestoneLabel, setMilestoneLabel] = useState(entry.milestoneLabel ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!body.trim()) {
      setError("Entry can't be empty.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await updateEntry(entry.id, {
          entryDate,
          title: title.trim() || undefined,
          body: body.trim(),
          milestoneType: milestoneType ? (milestoneType as MilestoneType) : undefined,
          milestoneLabel: milestoneType === "other" ? milestoneLabel.trim() || undefined : undefined,
        });
        setIsEditing(false);
        router.refresh();
      } catch {
        setError("Couldn't save changes — try again.");
      }
    });
  }

  function handleDelete() {
    if (!confirm("Delete this entry? This can't be undone.")) return;
    startTransition(async () => {
      await deleteEntry(entry.id);
      router.refresh();
    });
  }

  if (isEditing) {
    return (
      <article className="flex flex-col gap-3 rounded-2xl border border-emerald-300 p-4 dark:border-emerald-800">
        <div className="flex gap-3">
          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <div className="flex flex-wrap gap-3">
          <select
            value={milestoneType}
            onChange={(e) => setMilestoneType(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">No milestone</option>
            {MILESTONE_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          {milestoneType === "other" && (
            <input
              type="text"
              placeholder="Milestone name"
              value={milestoneLabel}
              onChange={(e) => setMilestoneLabel(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => setIsEditing(false)}
            disabled={isPending}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
          >
            Cancel
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="flex flex-col gap-2 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500">{formatEntryDate(entry.entryDate)}</span>
        <div className="flex items-center gap-2">
          {entry.milestoneType && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
              🏅{" "}
              {entry.milestoneType === "other"
                ? entry.milestoneLabel || "Milestone"
                : MILESTONE_LABELS[entry.milestoneType]}
            </span>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
      {entry.title && <h2 className="font-semibold">{entry.title}</h2>}
      <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{entry.body}</p>
      {entry.voiceMemoUrl && <audio controls src={entry.voiceMemoUrl} className="h-10 w-full" />}
      {entry.photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {entry.photos.map((photo) => (
            <Image
              key={photo.id}
              src={photo.url}
              alt={photo.caption ?? ""}
              width={120}
              height={120}
              className="h-28 w-28 rounded-lg object-cover"
            />
          ))}
        </div>
      )}
      <CommentThread entry={entry} />
    </article>
  );
}
