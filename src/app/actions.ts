"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createComment,
  createJournalEntry,
  deleteJournalEntry,
  deletePushSubscription,
  savePushSubscription,
  updateJournalEntry,
} from "@/db/queries";
import { audienceEnum, milestoneCategoryEnum } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { notifyFamily } from "@/lib/push";

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
  const { userId, familyId, name } = await requireSession();
  const parsed = entrySchema.parse(input);

  const entry = await createJournalEntry({
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

  const preview = (parsed.title || parsed.body).slice(0, 120);
  await notifyFamily(familyId, userId, {
    title: `🌱 ${name ?? "New entry"}`,
    body: preview,
    url: `/feed?entry=${entry.id}`,
  });
}

const updateEntrySchema = entrySchema.omit({ audience: true, voiceMemoUrl: true });

export async function updateEntry(entryId: number, input: z.infer<typeof updateEntrySchema>) {
  const { userId, familyId } = await requireSession();
  const parsed = updateEntrySchema.parse(input);

  const entry = await updateJournalEntry(entryId, familyId, userId, parsed);
  if (!entry) throw new Error("You can only edit entries you wrote.");

  revalidatePath("/");
  revalidatePath("/feed");
}

export async function deleteEntry(entryId: number) {
  const { userId, familyId } = await requireSession();
  const deleted = await deleteJournalEntry(entryId, familyId, userId);
  if (!deleted) throw new Error("You can only delete entries you wrote.");

  revalidatePath("/");
  revalidatePath("/feed");
}

const commentSchema = z.object({
  entryId: z.number(),
  body: z.string().min(1).max(2000),
});

export async function addComment(input: z.infer<typeof commentSchema>) {
  const { userId, familyId, name } = await requireSession();
  const parsed = commentSchema.parse(input);

  await createComment({ entryId: parsed.entryId, familyId, authorId: userId, body: parsed.body });
  revalidatePath("/");
  revalidatePath("/feed");

  await notifyFamily(familyId, userId, {
    title: `💬 ${name ?? "New comment"}`,
    body: parsed.body.slice(0, 120),
    url: `/feed?entry=${parsed.entryId}`,
  });
}

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

export async function subscribeToPush(input: z.infer<typeof pushSubscriptionSchema>) {
  const { userId } = await requireSession();
  const parsed = pushSubscriptionSchema.parse(input);

  await savePushSubscription({
    userId,
    endpoint: parsed.endpoint,
    p256dh: parsed.keys.p256dh,
    auth: parsed.keys.auth,
  });
}

export async function unsubscribeFromPush(endpoint: string) {
  await requireSession();
  await deletePushSubscription(endpoint);
}
