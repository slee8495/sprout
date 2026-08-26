"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEntry, updateDraft } from "./actions";
import { uploadJournalPhoto } from "@/lib/uploadPhoto";
import { readPhotoDate, readVideoDate } from "@/lib/captureDate";
import { uploadVoiceMemo } from "@/lib/uploadVoiceMemo";
import { getVideoDuration, MAX_VIDEO_DURATION_SECONDS, uploadJournalVideo } from "@/lib/uploadVideo";
import { maybeRequestReview } from "@/lib/inAppReview";
import type { Child } from "@/db/queries";
import type { milestoneCategoryEnum } from "@/db/schema";
import { getMilestoneCategories, subjectEmoji } from "@/lib/milestones";
import { fill } from "@/lib/i18n";
import { todayInTimezone } from "@/lib/date";
import { useSettings } from "./SettingsProvider";

type MilestoneCategory = (typeof milestoneCategoryEnum.enumValues)[number];

export type DraftEntryData = {
  id: number;
  childIds: number[];
  entryDate: string;
  title: string | null;
  body: string;
  milestoneCategory: string | null;
  milestoneLabel: string | null;
  photos: { id: number; url: string; sizeBytes: number | null }[];
  visibility: "everyone" | "inner";
};

const RECORDING_MIME_TYPES = ["audio/webm", "audio/mp4", "audio/ogg"];

function pickRecordingMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return RECORDING_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

export function EntryForm({
  initialDate,
  kids,
  defaultChildId,
  draft,
  onSaved,
}: {
  initialDate?: string;
  kids: Child[];
  defaultChildId?: number;
  draft?: DraftEntryData;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const { timezone, t } = useSettings();
  const formRef = useRef<HTMLFormElement>(null);

  const [entryDate, setEntryDate] = useState(draft?.entryDate ?? initialDate ?? todayInTimezone(timezone).iso);
  const [childIds, setChildIds] = useState<number[]>(
    draft ? draft.childIds : defaultChildId !== undefined ? [defaultChildId] : kids[0] ? [kids[0].id] : [],
  );
  const [title, setTitle] = useState(draft?.title ?? "");
  const [body, setBody] = useState(draft?.body ?? "");
  // Defaults to restricted for a fresh "Parents" post (no child tagged) and open otherwise —
  // fully overridable either direction, so a "just us" baby post is just as easy to mark.
  const [justUs, setJustUs] = useState(draft ? draft.visibility === "inner" : childIds.length === 0);
  const [milestoneCategory, setMilestoneCategory] = useState(draft?.milestoneCategory ?? "");
  const [milestoneLabel, setMilestoneLabel] = useState(draft?.milestoneLabel ?? "");
  const [existingPhotos, setExistingPhotos] = useState(draft?.photos ?? []);
  const [files, setFiles] = useState<File[]>([]);
  // When each photo was taken, so a throwback can be filed under the day it happened rather than
  // today. Index-aligned with `files`; null until read, and for photos that don't say (see
  // src/lib/captureDate.ts).
  const [photoDates, setPhotoDates] = useState<(string | null)[]>([]);
  const [readingPhotoDates, setReadingPhotoDates] = useState(false);
  const photoPickId = useRef(0);

  const [voiceMemo, setVoiceMemo] = useState<Blob | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDate, setVideoDate] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Re-seed all fields whenever the target changes: a different draft to resume, a
  // different default child, or a different date clicked on the calendar.
  const [prevKey, setPrevKey] = useState(`${draft?.id ?? "new"}:${defaultChildId}:${initialDate}`);
  const key = `${draft?.id ?? "new"}:${defaultChildId}:${initialDate}`;
  if (key !== prevKey) {
    setPrevKey(key);
    setEntryDate(draft?.entryDate ?? initialDate ?? todayInTimezone(timezone).iso);
    const nextChildIds = draft ? draft.childIds : defaultChildId !== undefined ? [defaultChildId] : kids[0] ? [kids[0].id] : [];
    setChildIds(nextChildIds);
    setJustUs(draft ? draft.visibility === "inner" : nextChildIds.length === 0);
    setTitle(draft?.title ?? "");
    setBody(draft?.body ?? "");
    setMilestoneCategory(draft?.milestoneCategory ?? "");
    setMilestoneLabel(draft?.milestoneLabel ?? "");
    setExistingPhotos(draft?.photos ?? []);
    setFiles([]);
    setPhotoDates([]);
    setVoiceMemo(null);
    setVideoFile(null);
    setVideoDate(null);
  }

  const selectedChildren = kids.filter((k) => childIds.includes(k.id));
  const milestoneCategories = getMilestoneCategories(selectedChildren[0]?.type ?? "child");

  function toggleChild(id: number) {
    setChildIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  const voiceMemoUrl = useMemo(() => (voiceMemo ? URL.createObjectURL(voiceMemo) : null), [voiceMemo]);
  useEffect(() => {
    return () => {
      if (voiceMemoUrl) URL.revokeObjectURL(voiceMemoUrl);
    };
  }, [voiceMemoUrl]);

  const videoPreviewUrl = useMemo(() => (videoFile ? URL.createObjectURL(videoFile) : null), [videoFile]);
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, [videoPreviewUrl]);

  const filePreviewUrls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => {
    return () => {
      filePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [filePreviewUrls]);

  function selectPhotos(picked: File[]) {
    setFiles(picked);
    setPhotoDates(picked.map(() => null));
    setReadingPhotoDates(picked.length > 0);
    // Reading is async, so a second pick could otherwise be overwritten by the first one landing.
    const pick = ++photoPickId.current;
    void Promise.all(picked.map(readPhotoDate)).then((dates) => {
      if (photoPickId.current !== pick) return;
      setPhotoDates(dates);
      setReadingPhotoDates(false);
    });
  }

  function removePhoto(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoDates((prev) => prev.filter((_, i) => i !== index));
  }

  // The earliest of the photos: for one occasion they all agree, and when they don't, the first
  // thing captured is the better guess at when it happened. A video's date is shown next to it but
  // deliberately left out of this — it only tells you when the clip was taken, it doesn't offer to
  // move the entry.
  const suggestedDate = useMemo(() => {
    const known = photoDates.filter((d): d is string => d !== null);
    return known.length > 0 ? known.reduce((a, b) => (a < b ? a : b)) : null;
  }, [photoDates]);

  const formatCaptureDate = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

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
      setVideoFile(file);
      setVideoDate(await readVideoDate(file));
    } catch {
      setError(t("Couldn't read that video file."));
    }
  }

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
        setVoiceMemo(new Blob(chunks, { type: mimeType || "audio/webm" }));
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

  function handleSave(isDraft: boolean) {
    if (isDraft === false && !body.trim()) {
      setError(t("Write something first."));
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        const uploaded = files.length ? await Promise.all(files.map((f) => uploadJournalPhoto(f))) : [];
        const photoList = [
          ...existingPhotos.map((p) => ({ url: p.url, sizeBytes: p.sizeBytes ?? undefined })),
          ...uploaded.map((r) => ({ url: r.url, sizeBytes: r.sizeBytes })),
        ];
        const uploadedVoiceMemoUrl = voiceMemo ? (await uploadVoiceMemo(voiceMemo)).url : undefined;
        const uploadedVideo = videoFile ? await uploadJournalVideo(videoFile) : undefined;

        const shared = {
          entryDate,
          title: title.trim() || undefined,
          body: body.trim(),
          milestoneCategory: milestoneCategory ? (milestoneCategory as MilestoneCategory) : undefined,
          milestoneLabel: milestoneCategory ? milestoneLabel.trim() || undefined : undefined,
          photos: photoList,
          isDraft,
          visibility: (justUs ? "inner" : "everyone") as "everyone" | "inner",
        };

        if (draft) {
          await updateDraft(draft.id, shared);
        } else {
          await createEntry({
            ...shared,
            audience: childIds.length ? "child" : "parents",
            childIds,
            voiceMemoUrl: uploadedVoiceMemoUrl,
            videoUrl: uploadedVideo?.url,
            videoSizeBytes: uploadedVideo?.sizeBytes,
          });
        }

        if (!isDraft) maybeRequestReview();

        setTitle("");
        setBody("");
        setMilestoneCategory("");
        setMilestoneLabel("");
        setExistingPhotos([]);
        setFiles([]);
        setPhotoDates([]);
        setVoiceMemo(null);
        setVideoFile(null);
        setVideoDate(null);
        formRef.current?.reset();
        onSaved?.();
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(fill(t("Couldn't save that entry — {message}"), { message }));
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => e.preventDefault()}
      className="flex flex-col gap-3 rounded-3xl border border-brand-200/70 bg-white p-4 shadow-md shadow-brand-900/5 dark:border-brand-800/50 dark:bg-zinc-900 dark:shadow-black/40"
    >
      {draft ? (
        <div className="flex flex-wrap items-center gap-2">
          {selectedChildren.length ? (
            selectedChildren.map((child) => (
              <span
                key={child.id}
                className="rounded-full bg-brand-100 px-3 py-1.5 font-heading text-sm font-semibold text-brand-800 dark:bg-brand-900/40 dark:text-brand-200"
              >
                {subjectEmoji(child.type)} {child.name}
              </span>
            ))
          ) : (
            <span className="rounded-full bg-brand-100 px-3 py-1.5 font-heading text-sm font-semibold text-brand-800 dark:bg-brand-900/40 dark:text-brand-200">
              {t("💌 Parents")}
            </span>
          )}
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{t("(can't change once saved)")}</span>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {kids.map((child) => (
            <button
              key={child.id}
              type="button"
              onClick={() => toggleChild(child.id)}
              className={`rounded-full px-3 py-1.5 font-heading text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
                childIds.includes(child.id)
                  ? "bg-brand-600 text-white shadow-sm shadow-brand-900/20"
                  : "border border-brand-100 text-brand-800 dark:border-brand-900/40 dark:text-brand-200"
              }`}
            >
              {subjectEmoji(child.type)} {child.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setChildIds([])}
            className={`rounded-full px-3 py-1.5 font-heading text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
              childIds.length === 0
                ? "bg-rose-500 text-white shadow-sm shadow-rose-900/20"
                : "border border-brand-100 text-brand-800 dark:border-brand-900/40 dark:text-brand-200"
            }`}
          >
            {t("💌 Parents")}
          </button>
        </div>
      )}

      <label className="flex w-fit items-center gap-2 text-sm">
        <input type="checkbox" checked={justUs} onChange={(e) => setJustUs(e.target.checked)} className="h-4 w-4" />
        <span className="font-heading font-semibold text-brand-800 dark:text-brand-200">{t("🔒 Just us")}</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {t("Hidden from extended family members")}
        </span>
      </label>

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

      <textarea
        placeholder={t("What happened today?")}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        className="rounded-2xl border border-brand-100 bg-white px-3 py-2 text-sm dark:border-brand-900/40 dark:bg-zinc-900"
      />

      {childIds.length > 0 && (
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
      )}

      {existingPhotos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {existingPhotos.map((photo) => (
            <div key={photo.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" className="h-24 w-24 rounded-2xl object-cover" />
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
        </div>
      )}

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {files.map((file, i) => (
              <div key={`${file.name}-${i}`} className="relative w-24">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={filePreviewUrls[i]} alt="" className="h-24 w-24 rounded-2xl object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900/80 text-xs font-bold text-white shadow-sm hover:bg-rose-600"
                  aria-label={t("Remove photo")}
                >
                  ×
                </button>
                <p className="mt-1 truncate text-center text-[11px] text-zinc-500 dark:text-zinc-400">
                  {/* Nothing while the date is still being read, so it never flashes "No date" first. */}
                  {photoDates[i] ? formatCaptureDate(photoDates[i]) : readingPhotoDates ? "\u00a0" : t("No date")}
                </p>
              </div>
            ))}
          </div>

          {/* The reason any of this exists: filing an old photo under today's date is the easy
              mistake, and the date picker alone never says when the photo was taken. */}
          {suggestedDate && suggestedDate !== entryDate && (
            <button
              type="button"
              onClick={() => setEntryDate(suggestedDate)}
              className="w-fit rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-left font-heading text-xs font-semibold text-brand-800 transition-transform hover:scale-105 active:scale-95 dark:border-brand-900/40 dark:bg-brand-950/40 dark:text-brand-200"
            >
              {fill(t("📅 Taken {date} — use this date"), { date: formatCaptureDate(suggestedDate) })}
            </button>
          )}
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
          onChange={(e) => selectPhotos(Array.from(e.target.files ?? []))}
          className="hidden"
        />
      </label>

      {!draft && (
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
          {voiceMemoUrl && !recording && (
            <>
              <audio controls src={voiceMemoUrl} className="h-8" />
              <button
                type="button"
                onClick={() => setVoiceMemo(null)}
                className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                {t("Remove")}
              </button>
            </>
          )}
        </div>
      )}

      {!draft && (
        <div className="flex flex-col gap-2">
          {videoPreviewUrl ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <video controls src={videoPreviewUrl} className="h-32 rounded-2xl" />
                <p className="truncate text-center text-[11px] text-zinc-500 dark:text-zinc-400">
                  {videoDate ? formatCaptureDate(videoDate) : t("No date")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setVideoFile(null);
                  setVideoDate(null);
                }}
                className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                {t("Remove")}
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-2 text-sm">
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
      )}

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleSave(false)}
          disabled={isPending}
          className="self-start rounded-full bg-brand-600 px-6 py-2 font-heading text-sm font-semibold text-white shadow-sm shadow-brand-900/20 transition-transform hover:scale-105 hover:bg-brand-700 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
        >
          {isPending ? t("Saving…") : draft ? t("Publish") : t("Save entry")}
        </button>
        <button
          type="button"
          onClick={() => handleSave(true)}
          disabled={isPending}
          className="self-start rounded-full border border-brand-600 px-6 py-2 font-heading text-sm font-semibold text-brand-700 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 dark:text-brand-300"
        >
          {t("Save as draft")}
        </button>
      </div>
    </form>
  );
}
