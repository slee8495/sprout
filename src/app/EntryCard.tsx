"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { JournalEntryWithPhotos } from "@/db/queries";
import { getMilestoneCategories, subjectEmoji, formatEntryDate } from "@/lib/milestones";
import { fill } from "@/lib/i18n";
import { authorBadgeClasses } from "@/lib/author";
import { formatDayOfLife, formatUploadedAt } from "@/lib/date";
import { deleteEntry, updateEntry } from "./actions";
import { CommentThread } from "./CommentThread";
import { PhotoCollage } from "./PhotoCollage";
import { PhotoLightbox } from "./PhotoLightbox";
import type { milestoneCategoryEnum } from "@/db/schema";
import { uploadJournalPhoto } from "@/lib/uploadPhoto";
import { useSettings } from "./SettingsProvider";

type MilestoneCategory = (typeof milestoneCategoryEnum.enumValues)[number];

export function EntryCard({ entry, highlighted }: { entry: JournalEntryWithPhotos; highlighted?: boolean }) {
  const router = useRouter();
  const { timezone, userId, t } = useSettings();
  const isAuthor = entry.authorId === userId;
  const wasEdited = new Date(entry.updatedAt).getTime() > new Date(entry.createdAt).getTime();
  const [showHighlight, setShowHighlight] = useState(highlighted ?? false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!highlighted) return;
    document.getElementById(`entry-${entry.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = setTimeout(() => setShowHighlight(false), 3000);
    return () => clearTimeout(timer);
  }, [highlighted, entry.id]);
  const [entryDate, setEntryDate] = useState(entry.entryDate);
  const [title, setTitle] = useState(entry.title ?? "");
  const [body, setBody] = useState(entry.body);
  const [milestoneCategory, setMilestoneCategory] = useState(entry.milestoneCategory ?? "");
  const [milestoneLabel, setMilestoneLabel] = useState(entry.milestoneLabel ?? "");
  const [existingPhotos, setExistingPhotos] = useState(entry.photos);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const milestoneCategories = getMilestoneCategories(entry.child?.type ?? "child");

  const newFilePreviews = useMemo(() => newFiles.map((f) => URL.createObjectURL(f)), [newFiles]);
  useEffect(() => {
    return () => {
      newFilePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newFilePreviews]);

  function handleSave() {
    if (!body.trim()) {
      setError(t("Entry can't be empty."));
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const uploaded = newFiles.length ? await Promise.all(newFiles.map((f) => uploadJournalPhoto(f))) : [];
        const photos = [
          ...existingPhotos.map((p) => ({ url: p.url, sizeBytes: p.sizeBytes ?? undefined })),
          ...uploaded.map((r) => ({ url: r.url, sizeBytes: r.sizeBytes })),
        ];

        await updateEntry(entry.id, {
          entryDate,
          title: title.trim() || undefined,
          body: body.trim(),
          milestoneCategory: milestoneCategory ? (milestoneCategory as MilestoneCategory) : undefined,
          milestoneLabel: milestoneCategory ? milestoneLabel.trim() || undefined : undefined,
          photos,
        });
        setIsEditing(false);
        setNewFiles([]);
        router.refresh();
      } catch {
        setError(t("Couldn't save changes — try again."));
      }
    });
  }

  function handleDelete() {
    if (!confirm(t("Delete this entry? This can't be undone."))) return;
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
            placeholder={t("Title (optional)")}
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
            <option value="">{t("No milestone")}</option>
            {milestoneCategories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.emoji} {t(c.label)}
              </option>
            ))}
          </select>
          {milestoneCategory && (
            <input
              type="text"
              placeholder={t("e.g. First broccoli")}
              value={milestoneLabel}
              onChange={(e) => setMilestoneLabel(e.target.value)}
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
                  aria-label={t("Remove photo")}
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
                  aria-label={t("Remove photo")}
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
            {isPending ? t("Saving…") : t("Save")}
          </button>
          <button
            onClick={() => setIsEditing(false)}
            disabled={isPending}
            className="rounded-full border border-emerald-100 px-5 py-2 font-heading text-sm font-semibold text-emerald-800 transition-transform hover:scale-105 active:scale-95 dark:border-emerald-900/40 dark:text-emerald-200"
          >
            {t("Cancel")}
          </button>
        </div>
      </article>
    );
  }

  return (
    <article
      id={`entry-${entry.id}`}
      className={`flex flex-col gap-2 rounded-3xl border bg-white p-4 shadow-md shadow-emerald-900/5 transition-colors dark:bg-zinc-900 dark:shadow-black/40 ${
        showHighlight
          ? "border-amber-400 ring-2 ring-amber-400 dark:border-amber-500 dark:ring-amber-500"
          : "border-emerald-100/60 dark:border-emerald-900/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {entry.author?.name && (
            <span
              className={`rounded-full px-2.5 py-0.5 font-heading text-xs font-semibold ${authorBadgeClasses(entry.author.name)}`}
            >
              {entry.author.name}
            </span>
          )}
          {entry.child && (
            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 font-heading text-xs font-semibold text-violet-800 dark:bg-violet-900/50 dark:text-violet-200">
              {subjectEmoji(entry.child.type)} {entry.child.name}
            </span>
          )}
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
            {formatEntryDate(entry.entryDate)}
          </span>
          {entry.child?.birthDate && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              {formatDayOfLife(entry.entryDate, entry.child.birthDate, entry.child.dayCountStart)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {entry.milestoneCategory && (
            <span className="rounded-full bg-amber-200 px-2.5 py-0.5 font-heading text-xs font-semibold text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
              {milestoneCategories.find((c) => c.value === entry.milestoneCategory)?.emoji ?? "🏅"}{" "}
              {entry.milestoneLabel || t("Milestone")}
            </span>
          )}
          {isAuthor && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              {t("Edit")}
            </button>
          )}
          {isAuthor && (
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="text-xs text-rose-400 hover:text-rose-600 disabled:opacity-50"
            >
              {t("Delete")}
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {fill(t("Uploaded {time}"), { time: formatUploadedAt(entry.createdAt, timezone) })}
        {wasEdited && <span className="italic"> {t("· Edited")}</span>}
      </p>
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
