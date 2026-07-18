"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createComment, createJournalEntry, deleteJournalEntry, updateJournalEntry } from "@/db/queries";
import { audienceEnum, milestoneCategoryEnum } from "@/db/schema";
import { requireSession } from "@/lib/session";

const entrySchema = z.object({
  audience: z.enum(audienceEnum.enumValues).default("roun"),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().max(256).optional(),
  body: z.string().min(1).max(10000),
  milestoneCategory: z.enum(milestoneCategoryEnum.enumValues).optional(),
  milestoneLabel: z.string().max(128).optional(),
  photoUrls: z.array(z.string().url()).max(10).optional(),
  voiceMemoUrl: z.string().url().optional(),
});

export async function createEntry(input: z.infer<typeof entrySchema>) {
  const { userId, familyId } = await requireSession();
  const parsed = entrySchema.parse(input);

  await createJournalEntry({
    familyId,
    authorId: userId,
    audience: parsed.audience,
    entryDate: parsed.entryDate,
    title: parsed.title,
    body: parsed.body,
    milestoneCategory: parsed.milestoneCategory,
    milestoneLabel: parsed.milestoneLabel,
    photoUrls: parsed.photoUrls,
    voiceMemoUrl: parsed.voiceMemoUrl,
  });

  revalidatePath("/");
  revalidatePath("/feed");
}

const updateEntrySchema = entrySchema.omit({ audience: true, photoUrls: true, voiceMemoUrl: true });

export async function updateEntry(entryId: number, input: z.infer<typeof updateEntrySchema>) {
  const { familyId } = await requireSession();
  const parsed = updateEntrySchema.parse(input);

  await updateJournalEntry(entryId, familyId, parsed);
  revalidatePath("/");
  revalidatePath("/feed");
}

export async function deleteEntry(entryId: number) {
  const { familyId } = await requireSession();
  await deleteJournalEntry(entryId, familyId);
  revalidatePath("/");
  revalidatePath("/feed");
}

const commentSchema = z.object({
  entryId: z.number(),
  body: z.string().min(1).max(2000),
});

export async function addComment(input: z.infer<typeof commentSchema>) {
  const { userId, familyId } = await requireSession();
  const parsed = commentSchema.parse(input);

  await createComment({ entryId: parsed.entryId, familyId, authorId: userId, body: parsed.body });
  revalidatePath("/");
  revalidatePath("/feed");
}
