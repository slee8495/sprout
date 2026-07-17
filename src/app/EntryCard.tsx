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
      <article className="flex flex-col gap-3 rounded-3xl border border-emerald-300/70 bg-white p-4 shadow-md shadow-emerald-900/5 dark:border-emerald-800/60 dark:bg-zinc-900 dark:shadow-black/40">
        <div className="flex gap-3">
          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-sm dark:border-emerald-900/40 dark:bg-zinc-900"
          />
          <input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="min-w-0 flex-1 rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-sm dark:border-emerald-900/40 dark:bg-zinc-900"
          />
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-sm dark:border-emerald-900/40 dark:bg-zinc-900"
        />
        <div className="flex flex-wrap gap-3">
          <select
            value={milestoneType}
            onChange={(e) => setMilestoneType(e.target.value)}
            className="rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-sm dark:border-emerald-900/40 dark:bg-zinc-900"
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
              className="min-w-0 flex-1 rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-sm dark:border-emerald-900/40 dark:bg-zinc-900"
            />
          )}
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="rounded-full bg-emerald-600 px-5 py-2 font-heading text-sm font-semibold text-white shadow-sm shadow-emerald-900/20 transition-transform hover:scale-105 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => setIsEditing(false)}
            disabled={isPending}
            className="rounded-full border border-emerald-100 px-5 py-2 font-heading text-sm font-semibold text-emerald-800 transition-transform hover:scale-105 active:scale-95 dark:border-emerald-900/40 dark:text-emerald-200"
          >
            Cancel
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="flex flex-col gap-2 rounded-3xl border border-emerald-100/60 bg-white p-4 shadow-md shadow-emerald-900/5 dark:border-emerald-900/40 dark:bg-zinc-900 dark:shadow-black/40">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-emerald-900/50 dark:text-emerald-100/50">
          {formatEntryDate(entry.entryDate)}
        </span>
        <div className="flex items-center gap-2">
          {entry.milestoneType && (
            <span className="rounded-full bg-amber-200 px-2.5 py-0.5 font-heading text-xs font-semibold text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
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
            className="text-xs text-rose-400 hover:text-rose-600 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
      {entry.title && <h2 className="font-heading font-bold text-emerald-950 dark:text-emerald-50">{entry.title}</h2>}
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
              className="h-28 w-28 rounded-2xl object-cover"
            />
          ))}
        </div>
      )}
      <CommentThread entry={entry} />
    </article>
  );
}
