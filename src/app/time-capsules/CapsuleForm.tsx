"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCapsule } from "./actions";

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function CapsuleForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [unlockDate, setUnlockDate] = useState(tomorrowISO());
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) {
      setError("Write your message first.");
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        await createCapsule({ unlockDate, title: title.trim() || undefined, body: body.trim() });
        setTitle("");
        setBody("");
        formRef.current?.reset();
        setUnlockDate(tomorrowISO());
        router.refresh();
      } catch {
        setError("Couldn't save that message — try again.");
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-3xl border border-emerald-200/70 bg-white p-4 shadow-md shadow-emerald-900/5 dark:border-emerald-800/50 dark:bg-zinc-900 dark:shadow-black/40"
    >
      <label className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
        Unlocks on
        <input
          type="date"
          value={unlockDate}
          min={tomorrowISO()}
          onChange={(e) => setUnlockDate(e.target.value)}
          className="w-40 rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-sm dark:border-emerald-900/40 dark:bg-zinc-900"
        />
      </label>
      <input
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-sm dark:border-emerald-900/40 dark:bg-zinc-900"
      />
      <textarea
        placeholder="Write a message to open in the future…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        className="rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-sm dark:border-emerald-900/40 dark:bg-zinc-900"
      />
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-full bg-emerald-600 px-6 py-2 font-heading text-sm font-semibold text-white shadow-sm shadow-emerald-900/20 transition-transform hover:scale-105 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
      >
        {isPending ? "Sealing…" : "Seal message"}
      </button>
    </form>
  );
}
