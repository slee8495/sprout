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
      className="flex flex-col gap-3 rounded-2xl border border-emerald-200 p-4 dark:border-emerald-900"
    >
      <label className="flex flex-col gap-1 text-xs text-zinc-500">
        Unlocks on
        <input
          type="date"
          value={unlockDate}
          min={tomorrowISO()}
          onChange={(e) => setUnlockDate(e.target.value)}
          className="w-40 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      <input
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      <textarea
        placeholder="Write a message to open in the future…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "Sealing…" : "Seal message"}
      </button>
    </form>
  );
}
