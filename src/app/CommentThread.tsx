"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { JournalEntryWithPhotos } from "@/db/queries";
import { addComment, updateComment } from "./actions";
import { useSettings } from "./SettingsProvider";

export function CommentThread({ entry }: { entry: JournalEntryWithPhotos }) {
  const router = useRouter();
  const { t, canEdit, userId } = useSettings();
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    startTransition(async () => {
      await addComment({ entryId: entry.id, body: body.trim() });
      setBody("");
      router.refresh();
    });
  }

  function startEditing(commentId: number, currentBody: string) {
    setEditingId(commentId);
    setEditBody(currentBody);
  }

  function handleSaveEdit(commentId: number) {
    if (!editBody.trim()) return;
    startTransition(async () => {
      await updateComment(commentId, editBody.trim());
      setEditingId(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2 border-t border-dashed border-brand-100 pt-2 dark:border-brand-900/40">
      {entry.comments.map((comment) => {
        const isEditing = editingId === comment.id;
        const isCommentAuthor = canEdit && comment.authorId === userId;

        if (isEditing) {
          return (
            <div key={comment.id} className="flex gap-2 text-xs">
              <input
                autoFocus
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                className="min-w-0 flex-1 rounded-full border border-brand-100 bg-transparent px-3 py-1 text-xs outline-none focus:border-brand-400 dark:border-brand-900/40"
              />
              <button
                onClick={() => handleSaveEdit(comment.id)}
                disabled={isPending || !editBody.trim()}
                className="font-heading text-xs font-semibold text-rose-500 disabled:opacity-40 dark:text-rose-300"
              >
                {t("Save")}
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="font-heading text-xs font-semibold text-zinc-500 dark:text-zinc-400"
              >
                {t("Cancel")}
              </button>
            </div>
          );
        }

        return (
          <div key={comment.id} className="flex items-baseline gap-1 text-xs">
            <span className="font-heading font-semibold text-rose-500 dark:text-rose-300">
              {comment.author?.name ?? t("Someone")}:
            </span>
            <span className="text-zinc-600 dark:text-zinc-400">{comment.body}</span>
            {comment.updatedAt && <span className="text-zinc-400 dark:text-zinc-500">{t("· Edited")}</span>}
            {isCommentAuthor && (
              <button
                onClick={() => startEditing(comment.id, comment.body)}
                className="text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300"
              >
                {t("Edit")}
              </button>
            )}
          </div>
        );
      })}
      {canEdit && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("Add a comment… 💬")}
            className="min-w-0 flex-1 rounded-full border border-brand-100 bg-transparent px-3 py-1 text-xs outline-none focus:border-brand-400 dark:border-brand-900/40"
          />
          <button
            type="submit"
            disabled={isPending || !body.trim()}
            className="font-heading text-xs font-semibold text-rose-500 disabled:opacity-40 dark:text-rose-300"
          >
            {t("Post")}
          </button>
        </form>
      )}
    </div>
  );
}
