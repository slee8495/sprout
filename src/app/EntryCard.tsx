"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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
import { uploadVoiceMemo } from "@/lib/uploadVoiceMemo";
import { getVideoDuration, MAX_VIDEO_DURATION_SECONDS, uploadJournalVideo } from "@/lib/uploadVideo";
import { useSettings } from "./SettingsProvider";

type MilestoneCategory = (typeof milestoneCategoryEnum.enumValues)[number];

const RECORDING_MIME_TYPES = ["audio/webm", "audio/mp4", "audio/ogg"];

function pickRecordingMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return RECORDING_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

export function EntryCard({ entry, highlighted }: { entry: JournalEntryWithPhotos; highlighted?: boolean }) {
  const router = useRouter();
  const { timezone, userId, t, canEdit } = useSettings();
  const isAuthor = entry.authorId === userId && canEdit;
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
  const [justUs, setJustUs] = useState(entry.visibility === "inner");
  const [title, setTitle] = useState(entry.title ?? "");
  const [body, setBody] = useState(entry.body);
  const [milestoneCategory, setMilestoneCategory] = useState(entry.milestoneCategory ?? "");
  const [milestoneLabel, setMilestoneLabel] = useState(entry.milestoneLabel ?? "");
  const [existingPhotos, setExistingPhotos] = useState(entry.photos);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [existingVoiceMemoUrl, setExistingVoiceMemoUrl] = useState(entry.voiceMemoUrl);
  const [newVoiceMemo, setNewVoiceMemo] = useState<Blob | null>(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState(entry.videoUrl);
  const [existingVideoSizeBytes, setExistingVideoSizeBytes] = useState(entry.videoSizeBytes);
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const milestoneCategories = getMilestoneCategories(entry.children[0]?.type ?? "child");

  const newFilePreviews = useMemo(() => newFiles.map((f) => URL.createObjectURL(f)), [newFiles]);
  useEffect(() => {
    return () => {
      newFilePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newFilePreviews]);

  const newVoiceMemoUrl = useMemo(() => (newVoiceMemo ? URL.createObjectURL(newVoiceMemo) : null), [newVoiceMemo]);
  useEffect(() => {
    return () => {
      if (newVoiceMemoUrl) URL.revokeObjectURL(newVoiceMemoUrl);
    };
  }, [newVoiceMemoUrl]);

  const newVideoPreviewUrl = useMemo(() => (newVideoFile ? URL.createObjectURL(newVideoFile) : null), [newVideoFile]);
  useEffect(() => {
    return () => {
      if (newVideoPreviewUrl) URL.revokeObjectURL(newVideoPreviewUrl);
    };
  }, [newVideoPreviewUrl]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickRecordingMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setNewVoiceMemo(new Blob(chunks, { type: mimeType || "audio/webm" }));
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError(t("Couldn't access the microphone."));
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
  }

  async function handleVideoSelected(file: File | undefined) {
    if (!file) return;
    try {
      const duration = await getVideoDuration(file);
      if (duration > MAX_VIDEO_DURATION_SECONDS + 1) {
        setError(
          fill(t("Videos must be {max}s or shorter (this one is {actual}s)."), {
            max: MAX_VIDEO_DURATION_SECONDS,
            actual: Math.round(duration),
          }),
        );
        return;
      }
      setError(null);
      setNewVideoFile(file);
    } catch {
      setError(t("Couldn't read that video file."));
    }
  }

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

        const voiceMemoUrl = newVoiceMemo ? (await uploadVoiceMemo(newVoiceMemo)).url : existingVoiceMemoUrl;

        let videoUrl = existingVideoUrl;
        let videoSizeBytes = existingVideoSizeBytes;
        if (newVideoFile) {
          const uploadedVideo = await uploadJournalVideo(newVideoFile);
          videoUrl = uploadedVideo.url;
          videoSizeBytes = uploadedVideo.sizeBytes;
        }

        await updateEntry(entry.id, {
          entryDate,
          title: title.trim() || undefined,
          body: body.trim(),
          milestoneCategory: milestoneCategory ? (milestoneCategory as MilestoneCategory) : undefined,
          milestoneLabel: milestoneCategory ? milestoneLabel.trim() || undefined : undefined,
          photos,
          voiceMemoUrl,
          videoUrl,
          videoSizeBytes,
          visibility: justUs ? "inner" : "everyone",
        });
        setIsEditing(false);
        setNewFiles([]);
        setNewVoiceMemo(null);
        setNewVideoFile(null);
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
      <article className="flex flex-col gap-3 rounded-3xl border border-brand-300/70 bg-white p-4 shadow-md shadow-brand-900/5 dark:border-brand-800/60 dark:bg-zinc-900 dark:shadow-black/40">
        <div className="flex gap-3">
          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="rounded-2xl border border-brand-100 bg-white px-3 py-2 text-sm dark:border-brand-900/40 dark:bg-zinc-900"
          />
          <input
            type="text"
            placeholder={t("Title (optional)")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="min-w-0 flex-1 rounded-2xl border border-brand-100 bg-white px-3 py-2 text-sm dark:border-brand-900/40 dark:bg-zinc-900"
          />
        </div>
        <label className="flex w-fit items-center gap-2 text-sm">
          <input type="checkbox" checked={justUs} onChange={(e) => setJustUs(e.target.checked)} className="h-4 w-4" />
          <span className="font-heading font-semibold text-brand-800 dark:text-brand-200">{t("🔒 Just us")}</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{t("Hidden from extended family members")}</span>
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="rounded-2xl border border-brand-100 bg-white px-3 py-2 text-sm dark:border-brand-900/40 dark:bg-zinc-900"
        />
        <div className="flex flex-wrap gap-3">
          <select
            value={milestoneCategory}
            onChange={(e) => setMilestoneCategory(e.target.value)}
            className="rounded-2xl border border-brand-100 bg-white px-3 py-2 text-sm dark:border-brand-900/40 dark:bg-zinc-900"
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
              className="min-w-0 flex-1 rounded-2xl border border-brand-100 bg-white px-3 py-2 text-sm dark:border-brand-900/40 dark:bg-zinc-900"
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
        <label className="flex w-fit items-center gap-2 text-sm">
          <span className="rounded-full border border-brand-100 px-3 py-1.5 font-heading text-sm font-semibold text-brand-800 dark:border-brand-900/40 dark:text-brand-200">
            {t("📷 Add photos")}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setNewFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
            className="hidden"
          />
        </label>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => (recording ? stopRecording() : startRecording())}
            className={`rounded-full px-3 py-1.5 font-heading text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
              recording
                ? "bg-rose-500 text-white shadow-sm shadow-rose-900/20"
                : "border border-brand-100 text-brand-800 dark:border-brand-900/40 dark:text-brand-200"
            }`}
          >
            {recording ? t("⏹ Stop recording") : t("🎤 Voice memo")}
          </button>
          {(newVoiceMemoUrl || existingVoiceMemoUrl) && !recording && (
            <>
              <audio controls src={newVoiceMemoUrl ?? existingVoiceMemoUrl ?? undefined} className="h-8" />
              <button
                type="button"
                onClick={() => {
                  setNewVoiceMemo(null);
                  setExistingVoiceMemoUrl(null);
                }}
                className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                {t("Remove")}
              </button>
            </>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {newVideoPreviewUrl || existingVideoUrl ? (
            <div className="flex items-center gap-3">
              <video controls src={newVideoPreviewUrl ?? existingVideoUrl ?? undefined} className="h-32 rounded-2xl" />
              <button
                type="button"
                onClick={() => {
                  setNewVideoFile(null);
                  setExistingVideoUrl(null);
                  setExistingVideoSizeBytes(null);
                }}
                className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                {t("Remove")}
              </button>
            </div>
          ) : (
            <label className="flex w-fit items-center gap-2 text-sm">
              <span className="rounded-full border border-brand-100 px-3 py-1.5 font-heading text-sm font-semibold text-brand-800 dark:border-brand-900/40 dark:text-brand-200">
                {t("🎥 Video (max 1 min)")}
              </span>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleVideoSelected(e.target.files?.[0])}
                className="hidden"
              />
            </label>
          )}
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="rounded-full bg-brand-600 px-5 py-2 font-heading text-sm font-semibold text-white shadow-sm shadow-brand-900/20 transition-transform hover:scale-105 hover:bg-brand-700 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isPending ? t("Saving…") : t("Save")}
          </button>
          <button
            onClick={() => setIsEditing(false)}
            disabled={isPending}
            className="rounded-full border border-brand-100 px-5 py-2 font-heading text-sm font-semibold text-brand-800 transition-transform hover:scale-105 active:scale-95 dark:border-brand-900/40 dark:text-brand-200"
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
      className={`flex flex-col gap-2 rounded-3xl border bg-white p-4 shadow-md shadow-brand-900/5 transition-colors dark:bg-zinc-900 dark:shadow-black/40 ${
        showHighlight
          ? "border-amber-400 ring-2 ring-amber-400 dark:border-amber-500 dark:ring-amber-500"
          : "border-brand-100/60 dark:border-brand-900/40"
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
          {entry.children.map((child) => (
            <span key={child.id} className="flex items-center gap-1">
              <span className="rounded-full bg-violet-100 px-2.5 py-0.5 font-heading text-xs font-semibold text-violet-800 dark:bg-violet-900/50 dark:text-violet-200">
                {subjectEmoji(child.type)} {child.name}
              </span>
              {child.birthDate && (
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                  {formatDayOfLife(entry.entryDate, child.birthDate, child.dayCountStart)}
                </span>
              )}
            </span>
          ))}
          <span className="text-xs font-semibold text-brand-800 dark:text-brand-200">
            {formatEntryDate(entry.entryDate)}
          </span>
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
      {entry.title && <h2 className="font-heading font-bold text-brand-950 dark:text-brand-50">{entry.title}</h2>}
      <p className="whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">{entry.body}</p>
      {entry.voiceMemoUrl && <audio controls src={entry.voiceMemoUrl} className="h-10 w-full" />}
      {entry.videoUrl && <video controls src={entry.videoUrl} className="w-full rounded-2xl" />}
      <PhotoCollage photos={entry.photos} onOpen={setLightboxIndex} />
      {lightboxIndex !== null && (
        <PhotoLightbox photos={entry.photos} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
      <CommentThread entry={entry} />
    </article>
  );
}
