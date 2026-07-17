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
    <div className="flex flex-col gap-2 border-t border-dashed border-emerald-100 pt-2 dark:border-emerald-900/40">
      {entry.comments.map((comment) => (
        <div key={comment.id} className="text-xs">
          <span className="font-heading font-semibold text-rose-500 dark:text-rose-300">
            {comment.author?.name ?? "Someone"}:
          </span>{" "}
          <span className="text-zinc-500">{comment.body}</span>
        </div>
      ))}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment… 💬"
          className="min-w-0 flex-1 rounded-full border border-emerald-100 bg-transparent px-3 py-1 text-xs outline-none focus:border-emerald-400 dark:border-emerald-900/40"
        />
        <button
          type="submit"
          disabled={isPending || !body.trim()}
          className="font-heading text-xs font-semibold text-rose-500 disabled:opacity-40 dark:text-rose-300"
        >
          Post
        </button>
      </form>
    </div>
  );
}
