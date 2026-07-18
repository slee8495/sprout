"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEntry } from "./actions";
import { uploadJournalPhoto } from "@/lib/uploadPhoto";
import { uploadVoiceMemo } from "@/lib/uploadVoiceMemo";
import type { audienceEnum, milestoneCategoryEnum } from "@/db/schema";
import { MILESTONE_CATEGORIES } from "@/lib/milestones";
import { todayInFamilyTimezone } from "@/lib/date";

type Audience = (typeof audienceEnum.enumValues)[number];
type MilestoneCategory = (typeof milestoneCategoryEnum.enumValues)[number];

const RECORDING_MIME_TYPES = ["audio/webm", "audio/mp4", "audio/ogg"];

function pickRecordingMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return RECORDING_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

export function EntryForm({ initialDate }: { initialDate?: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [entryDate, setEntryDate] = useState(initialDate ?? todayInFamilyTimezone().iso);
  const [prevInitialDate, setPrevInitialDate] = useState(initialDate);
  if (initialDate !== prevInitialDate) {
    setPrevInitialDate(initialDate);
    if (initialDate) setEntryDate(initialDate);
  }
  const [audience, setAudience] = useState<Audience>("roun");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [milestoneCategory, setMilestoneCategory] = useState("");
  const [milestoneLabel, setMilestoneLabel] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [voiceMemo, setVoiceMemo] = useState<Blob | null>(null);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const voiceMemoUrl = useMemo(() => (voiceMemo ? URL.createObjectURL(voiceMemo) : null), [voiceMemo]);
  useEffect(() => {
    return () => {
      if (voiceMemoUrl) URL.revokeObjectURL(voiceMemoUrl);
    };
  }, [voiceMemoUrl]);

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
      setError("Couldn't access the microphone.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) {
      setError("Write something first.");
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        const photoUrls = files.length
          ? (await Promise.all(files.map((f) => uploadJournalPhoto(f)))).map((r) => r.url)
          : [];
        const uploadedVoiceMemoUrl = voiceMemo ? (await uploadVoiceMemo(voiceMemo)).url : undefined;

        await createEntry({
          audience,
          entryDate,
          title: title.trim() || undefined,
          body: body.trim(),
          milestoneCategory: milestoneCategory ? (milestoneCategory as MilestoneCategory) : undefined,
          milestoneLabel: milestoneCategory ? milestoneLabel.trim() || undefined : undefined,
          photoUrls,
          voiceMemoUrl: uploadedVoiceMemoUrl,
        });

        setTitle("");
        setBody("");
        setMilestoneCategory("");
        setMilestoneLabel("");
        setFiles([]);
        setVoiceMemo(null);
        formRef.current?.reset();
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(`Couldn't save that entry — ${message}`);
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-3xl border border-emerald-200/70 bg-white p-4 shadow-md shadow-emerald-900/5 dark:border-emerald-800/50 dark:bg-zinc-900 dark:shadow-black/40"
    >
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAudience("roun")}
          className={`rounded-full px-3 py-1.5 font-heading text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
            audience === "roun"
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-900/20"
              : "border border-emerald-100 text-emerald-800 dark:border-emerald-900/40 dark:text-emerald-200"
          }`}
        >
          🌱 로운
        </button>
        <button
          type="button"
          onClick={() => setAudience("parents")}
          className={`rounded-full px-3 py-1.5 font-heading text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
            audience === "parents"
              ? "bg-rose-500 text-white shadow-sm shadow-rose-900/20"
              : "border border-emerald-100 text-emerald-800 dark:border-emerald-900/40 dark:text-emerald-200"
          }`}
        >
          💌 엄마아빠
        </button>
      </div>

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
        placeholder="What happened today?"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        className="rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-sm dark:border-emerald-900/40 dark:bg-zinc-900"
      />

      {audience === "roun" && (
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
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        className="text-sm"
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => (recording ? stopRecording() : startRecording())}
          className={`rounded-full px-3 py-1.5 font-heading text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
            recording
              ? "bg-rose-500 text-white shadow-sm shadow-rose-900/20"
              : "border border-emerald-100 text-emerald-800 dark:border-emerald-900/40 dark:text-emerald-200"
          }`}
        >
          {recording ? "⏹ Stop recording" : "🎤 Voice memo"}
        </button>
        {voiceMemoUrl && !recording && (
          <>
            <audio controls src={voiceMemoUrl} className="h-8" />
            <button
              type="button"
              onClick={() => setVoiceMemo(null)}
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              Remove
            </button>
          </>
        )}
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-full bg-emerald-600 px-6 py-2 font-heading text-sm font-semibold text-white shadow-sm shadow-emerald-900/20 transition-transform hover:scale-105 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
      >
        {isPending ? "Saving…" : "Save entry"}
      </button>
    </form>
  );
}
