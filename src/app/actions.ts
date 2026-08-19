"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  countUnreadNotifications,
  createComment,
  createJournalEntry,
  createNotificationsForFamily,
  deleteJournalEntry,
  deletePushSubscription,
  getChild,
  getJournalEntryChildren,
  isFamilyPaid,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  savePushSubscription,
  setPhotoAlbumExclusion as setPhotoAlbumExclusionQuery,
  updateJournalEntry,
} from "@/db/queries";
import { audienceEnum, entryVisibilityEnum, milestoneCategoryEnum } from "@/db/schema";
import { requireEditor, requireSession } from "@/lib/session";
import { notifyFamily } from "@/lib/push";

// Labels a notification with who/what the entry is about, e.g. "[Roun]", "[Brownie]",
// "[Roun, Brownie]", or "[Parents]" if tagged to none — lets the recipient tell at a glance which
// feed tab(s) a notification belongs to.
function subjectLabel(children: { name: string }[]) {
  if (children.length === 0) return "[Parents]";
  if (children.length <= 2) return `[${children.map((c) => c.name).join(", ")}]`;
  return `[${children[0].name}, ${children[1].name} +${children.length - 2} more]`;
}

const entrySchema = z.object({
  audience: z.enum(audienceEnum.enumValues).default("child"),
  // "inner" hides this entry from any family member set to the "extended" visibility tier in
  // Settings (e.g. grandparents) — lets parents post freely without worrying who else can see it.
  visibility: z.enum(entryVisibilityEnum.enumValues).default("everyone"),
  childIds: z.array(z.number()).default([]),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().max(256).optional(),
  body: z.string().max(10000),
  milestoneCategory: z.enum(milestoneCategoryEnum.enumValues).optional(),
  milestoneLabel: z.string().max(128).optional(),
  photos: z.array(z.object({ url: z.string().url(), sizeBytes: z.number().optional() })).max(10).optional(),
  voiceMemoUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  videoSizeBytes: z.number().optional(),
  isDraft: z.boolean().optional(),
});

export async function createEntry(input: z.infer<typeof entrySchema>) {
  const { userId, familyId, name } = await requireEditor();
  const parsed = entrySchema.parse(input);

  let children: NonNullable<Awaited<ReturnType<typeof getChild>>>[] = [];
  if (parsed.audience === "child") {
    if (!parsed.childIds.length) throw new Error("Pick who this entry is about.");
    const found = await Promise.all(parsed.childIds.map((id) => getChild(id, familyId)));
    if (found.some((c) => !c)) throw new Error("That child doesn't belong to your family.");
    children = found as NonNullable<Awaited<ReturnType<typeof getChild>>>[];
  }
  if (!parsed.isDraft && !parsed.body.trim()) throw new Error("Write something before publishing.");

  const entry = await createJournalEntry({
    familyId,
    authorId: userId,
    audience: parsed.audience,
    visibility: parsed.visibility,
    childIds: parsed.audience === "child" ? parsed.childIds : undefined,
    entryDate: parsed.entryDate,
    title: parsed.title,
    body: parsed.body,
    milestoneCategory: parsed.milestoneCategory,
    milestoneLabel: parsed.milestoneLabel,
    photos: parsed.photos,
    voiceMemoUrl: parsed.voiceMemoUrl,
    videoUrl: parsed.videoUrl,
    videoSizeBytes: parsed.videoSizeBytes,
    isDraft: parsed.isDraft,
  });

  revalidatePath("/");
  revalidatePath("/feed");

  if (parsed.isDraft) return;

  const preview = (parsed.title || parsed.body).slice(0, 120);
  const payload = {
    title: `${subjectLabel(children)} ${name ?? "New entry"}`,
    body: preview,
    url: `/feed?entry=${entry.id}`,
  };
  await Promise.all([
    notifyFamily(familyId, userId, payload, parsed.visibility),
    createNotificationsForFamily(familyId, userId, payload, parsed.visibility),
  ]);
}

const updateEntrySchema = entrySchema.omit({ audience: true, childIds: true, isDraft: true }).extend({
  voiceMemoUrl: z.string().url().nullable().optional(),
  videoUrl: z.string().url().nullable().optional(),
  videoSizeBytes: z.number().nullable().optional(),
});

export async function updateEntry(entryId: number, input: z.infer<typeof updateEntrySchema>) {
  const { userId, familyId } = await requireEditor();
  const parsed = updateEntrySchema.parse(input);
  if (!parsed.body.trim()) throw new Error("Entry can't be empty.");

  const entry = await updateJournalEntry(entryId, familyId, userId, parsed);
  if (!entry) throw new Error("You can only edit entries you wrote.");

  revalidatePath("/");
  revalidatePath("/feed");
}

const draftUpdateSchema = entrySchema.omit({ audience: true, childIds: true, voiceMemoUrl: true });

// Resumes and saves a private draft — either re-saving it as a draft (isDraft: true, no
// notification) or publishing it to the family for the first time (isDraft: false, notifies
// like a fresh entry would).
export async function updateDraft(entryId: number, input: z.infer<typeof draftUpdateSchema>) {
  const { userId, familyId, name } = await requireEditor();
  const parsed = draftUpdateSchema.parse(input);
  if (!parsed.isDraft && !parsed.body.trim()) throw new Error("Write something before publishing.");

  const entry = await updateJournalEntry(entryId, familyId, userId, parsed);
  if (!entry) throw new Error("You can only edit drafts you wrote.");

  revalidatePath("/");
  revalidatePath("/feed");

  if (parsed.isDraft) return;

  const children = await getJournalEntryChildren(entry.id);
  const preview = (parsed.title || parsed.body).slice(0, 120);
  const payload = {
    title: `${subjectLabel(children)} ${name ?? "New entry"}`,
    body: preview,
    url: `/feed?entry=${entry.id}`,
  };
  await Promise.all([
    notifyFamily(familyId, userId, payload, parsed.visibility),
    createNotificationsForFamily(familyId, userId, payload, parsed.visibility),
  ]);
}

export async function deleteEntry(entryId: number) {
  const { userId, familyId } = await requireEditor();
  const deleted = await deleteJournalEntry(entryId, familyId, userId);
  if (!deleted) throw new Error("You can only delete entries you wrote.");

  revalidatePath("/");
  revalidatePath("/feed");
}

export async function setPhotoAlbumExclusion(photoId: number, excluded: boolean) {
  const { familyId } = await requireEditor();
  const updated = await setPhotoAlbumExclusionQuery(photoId, familyId, excluded);
  if (!updated) throw new Error("Photo not found.");

  revalidatePath("/library");
}

const commentSchema = z.object({
  entryId: z.number(),
  body: z.string().min(1).max(2000),
});

export async function addComment(input: z.infer<typeof commentSchema>) {
  const { userId, familyId, name } = await requireEditor();
  const parsed = commentSchema.parse(input);

  const comment = await createComment({ entryId: parsed.entryId, familyId, authorId: userId, body: parsed.body });
  revalidatePath("/");
  revalidatePath("/feed");

  const payload = {
    title: `💬 ${subjectLabel(comment.children)} ${name ?? "New comment"}`,
    body: parsed.body.slice(0, 120),
    url: `/feed?entry=${parsed.entryId}`,
  };
  await Promise.all([
    notifyFamily(familyId, userId, payload, comment.visibility),
    createNotificationsForFamily(familyId, userId, payload, comment.visibility),
  ]);
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

// Called by the client once its local tap counter hits the ad-frequency threshold.
// Free-tier families see the interstitial; paid/trial/complimentary families never do.
export async function checkClickAd() {
  const { familyId } = await requireSession();
  return isFamilyPaid(familyId).then((paid) => !paid);
}

export async function getNotifications() {
  const { userId } = await requireSession();
  const [items, unreadCount] = await Promise.all([listNotifications(userId), countUnreadNotifications(userId)]);
  return { items, unreadCount };
}

export async function readNotification(notificationId: number) {
  const { userId } = await requireSession();
  await markNotificationRead(notificationId, userId);
}

export async function readAllNotifications() {
  const { userId } = await requireSession();
  await markAllNotificationsRead(userId);
}
