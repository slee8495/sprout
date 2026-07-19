"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { JournalEntryWithPhotos } from "@/db/queries";
import { MILESTONE_CATEGORIES, formatEntryDate } from "@/lib/milestones";
import { authorBadgeClasses } from "@/lib/author";
import { formatDayOfLife, formatEntryTime } from "@/lib/date";
import { deleteEntry, updateEntry } from "./actions";
import { CommentThread } from "./CommentThread";
import { PhotoCollage } from "./PhotoCollage";
import { PhotoLightbox } from "./PhotoLightbox";
import type { milestoneCategoryEnum } from "@/db/schema";
import { uploadJournalPhoto } from "@/lib/uploadPhoto";

type MilestoneCategory = (typeof milestoneCategoryEnum.enumValues)[number];

export function EntryCard({ entry }: { entry: JournalEntryWithPhotos }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [entryDate, setEntryDate] = useState(entry.entryDate);
  const [title, setTitle] = useState(entry.title ?? "");
  const [body, setBody] = useState(entry.body);
  const [milestoneCategory, setMilestoneCategory] = useState(entry.milestoneCategory ?? "");
  const [milestoneLabel, setMilestoneLabel] = useState(entry.milestoneLabel ?? "");
  const [milestonePlace, setMilestonePlace] = useState(entry.milestonePlace ?? "");
  const [existingPhotos, setExistingPhotos] = useState(entry.photos);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const newFilePreviews = useMemo(() => newFiles.map((f) => URL.createObjectURL(f)), [newFiles]);
  useEffect(() => {
    return () => {
      newFilePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newFilePreviews]);

  function handleSave() {
    if (!body.trim()) {
      setError("Entry can't be empty.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const uploadedUrls = newFiles.length
          ? (await Promise.all(newFiles.map((f) => uploadJournalPhoto(f)))).map((r) => r.url)
          : [];
        const photoUrls = [...existingPhotos.map((p) => p.url), ...uploadedUrls];

        await updateEntry(entry.id, {
          entryDate,
          title: title.trim() || undefined,
          body: body.trim(),
          milestoneCategory: milestoneCategory ? (milestoneCategory as MilestoneCategory) : undefined,
          milestoneLabel: milestoneCategory ? milestoneLabel.trim() || undefined : undefined,
          milestonePlace: milestoneCategory ? milestonePlace.trim() || undefined : undefined,
          photoUrls,
        });
        setIsEditing(false);
        setNewFiles([]);
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
            value={milestoneCategory}
            onChange={(e) => setMilestoneCategory(e.target.value)}
            className="rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-sm dark:border-emerald-900/40 dark:bg-zinc-900"
          >
            <option value="">No milestone</option>
            {MILESTONE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
          {milestoneCategory && (
            <input
              type="text"
              placeholder="e.g. First broccoli"
              value={milestoneLabel}
              onChange={(e) => setMilestoneLabel(e.target.value)}
              className="min-w-0 flex-1 rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-sm dark:border-emerald-900/40 dark:bg-zinc-900"
            />
          )}
          {milestoneCategory && (
            <input
              type="text"
              placeholder="Place (optional)"
              value={milestonePlace}
              onChange={(e) => setMilestonePlace(e.target.value)}
              className="min-w-0 flex-1 rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-sm dark:border-emerald-900/40 dark:bg-zinc-900"
            />
          )}
        </div>
        {(existingPhotos.length > 0 || newFiles.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {existingPhotos.map((photo) => (
              <div key={photo.id} className="relative">
                <Image
                  src={photo.url}
                  alt={photo.caption ?? ""}
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-2xl object-cover"
                />
                <button
                  type="button"
                  onClick={() => setExistingPhotos((prev) => prev.filter((p) => p.id !== photo.id))}
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900/80 text-xs font-bold text-white shadow-sm hover:bg-rose-600"
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}
            {newFiles.map((file, i) => (
              <div key={`${file.name}-${i}`} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={newFilePreviews[i]} alt="" className="h-24 w-24 rounded-2xl object-cover" />
                <button
                  type="button"
                  onClick={() => setNewFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900/80 text-xs font-bold text-white shadow-sm hover:bg-rose-600"
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setNewFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
          className="text-sm"
        />
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
        <div className="flex flex-wrap items-center gap-2">
          {entry.author?.name && (
            <span
              className={`rounded-full px-2.5 py-0.5 font-heading text-xs font-semibold ${authorBadgeClasses(entry.author.name)}`}
            >
              {entry.author.name}
            </span>
          )}
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
            {formatEntryDate(entry.entryDate)} · {formatEntryTime(entry.createdAt)}
          </span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            {formatDayOfLife(entry.entryDate)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {entry.milestoneCategory && (
            <span className="rounded-full bg-amber-200 px-2.5 py-0.5 font-heading text-xs font-semibold text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
              {MILESTONE_CATEGORIES.find((c) => c.value === entry.milestoneCategory)?.emoji ?? "🏅"}{" "}
              {entry.milestoneLabel || "Milestone"}
              {entry.milestonePlace ? ` · 📍${entry.milestonePlace}` : ""}
            </span>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
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
      <p className="whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">{entry.body}</p>
      {entry.voiceMemoUrl && <audio controls src={entry.voiceMemoUrl} className="h-10 w-full" />}
      <PhotoCollage photos={entry.photos} onOpen={setLightboxIndex} />
      {lightboxIndex !== null && (
        <PhotoLightbox photos={entry.photos} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
      <CommentThread entry={entry} />
    </article>
  );
}
