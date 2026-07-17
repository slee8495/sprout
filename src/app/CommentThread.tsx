"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { JournalEntryWithPhotos } from "@/db/queries";
import { addComment } from "./actions";

export function CommentThread({ entry }: { entry: JournalEntryWithPhotos }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    startTransition(async () => {
      await addComment({ entryId: entry.id, body: body.trim() });
      setBody("");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2 border-t border-zinc-100 pt-2 dark:border-zinc-900">
      {entry.comments.map((comment) => (
        <div key={comment.id} className="text-xs">
          <span className="font-medium text-zinc-600 dark:text-zinc-400">
            {comment.author?.name ?? "Someone"}:
          </span>{" "}
          <span className="text-zinc-500">{comment.body}</span>
        </div>
      ))}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment…"
          className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-transparent px-2 py-1 text-xs outline-none focus:border-emerald-400 dark:border-zinc-700"
        />
        <button
          type="submit"
          disabled={isPending || !body.trim()}
          className="text-xs text-emerald-700 disabled:opacity-40 dark:text-emerald-400"
        >
          Post
        </button>
      </form>
    </div>
  );
}
