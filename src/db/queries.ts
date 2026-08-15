import { and, desc, eq, ilike, inArray, isNotNull, isNull, lt, ne, sql } from "drizzle-orm";
import { db } from "./index";
import { isPaidStatus } from "@/lib/storage";
import {
  audienceEnum,
  children,
  comments,
  dayCountStartEnum,
  families,
  journalEntries,
  journalEntryChildren,
  milestoneCategoryEnum,
  notifications,
  photos,
  pushSubscriptions,
  subjectTypeEnum,
  subscriptionStatusEnum,
  userRoleEnum,
  users,
} from "./schema";

const INVITE_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L, avoids ambiguous codes

function generateInviteCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) code += INVITE_CODE_ALPHABET[Math.floor(Math.random() * INVITE_CODE_ALPHABET.length)];
  return code;
}

export function isUniqueConstraintError(err: unknown, column?: string): boolean {
  const pgErr = err as { code?: string; constraint_name?: string; message?: string };
  if (pgErr?.code !== "23505") return false;
  if (!column) return true;
  return (pgErr.constraint_name ?? pgErr.message ?? "").toLowerCase().includes(column.toLowerCase());
}

export async function getFamilyByInviteCode(inviteCode: string) {
  return db.query.families.findFirst({ where: eq(families.inviteCode, inviteCode) });
}

export async function getFamilyMemberByName(familyId: number, name: string) {
  return db.query.users.findFirst({ where: and(eq(users.familyId, familyId), ilike(users.name, name)) });
}

export async function listFamilyMemberEmails(familyId: number) {
  const rows = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(eq(users.familyId, familyId));
  return rows;
}

export async function getUserByEmail(email: string) {
  return db.query.users.findFirst({ where: eq(users.email, email) });
}

export async function getUserById(id: number) {
  return db.query.users.findFirst({ where: eq(users.id, id) });
}

export function listChildren(familyId: number) {
  return db.query.children.findMany({
    where: eq(children.familyId, familyId),
    orderBy: [children.id],
  });
}

export type Child = Awaited<ReturnType<typeof listChildren>>[number];

export function getChild(childId: number, familyId: number) {
  return db.query.children.findFirst({ where: and(eq(children.id, childId), eq(children.familyId, familyId)) });
}

export async function createChild(input: {
  familyId: number;
  name: string;
  type?: (typeof subjectTypeEnum.enumValues)[number];
  birthDate?: string;
  dayCountStart?: (typeof dayCountStartEnum.enumValues)[number];
  coverAnimal?: string;
  coverBackground?: string;
}) {
  const [child] = await db
    .insert(children)
    .values({
      familyId: input.familyId,
      name: input.name,
      type: input.type ?? "child",
      birthDate: input.birthDate || null,
      dayCountStart: input.dayCountStart ?? "zero",
      coverAnimal: input.coverAnimal || null,
      coverBackground: input.coverBackground || null,
    })
    .returning();
  return child;
}

export async function updateChild(
  childId: number,
  familyId: number,
  patch: {
    name: string;
    type: (typeof subjectTypeEnum.enumValues)[number];
    birthDate: string;
    dayCountStart: (typeof dayCountStartEnum.enumValues)[number];
    coverAnimal?: string;
    coverBackground?: string;
  },
) {
  const [child] = await db
    .update(children)
    .set({
      name: patch.name,
      type: patch.type,
      birthDate: patch.birthDate,
      dayCountStart: patch.dayCountStart,
      coverAnimal: patch.coverAnimal || null,
      coverBackground: patch.coverBackground || null,
    })
    .where(and(eq(children.id, childId), eq(children.familyId, familyId)))
    .returning();
  if (!child) throw new Error("Couldn't find that child or pet to update.");
  return child;
}

export async function createFamilyWithOwner(input: { familyName: string; ownerName: string; email: string }) {
  return db.transaction(async (tx) => {
    let family: typeof families.$inferSelect | undefined;
    let lastError: unknown;
    for (let attempt = 0; attempt < 5 && !family; attempt++) {
      try {
        [family] = await tx
          .insert(families)
          .values({ name: input.familyName, inviteCode: generateInviteCode() })
          .returning();
      } catch (err) {
        lastError = err;
      }
    }
    if (!family) throw lastError ?? new Error("Could not create family");

    const [user] = await tx
      .insert(users)
      .values({ familyId: family.id, email: input.email, name: input.ownerName, role: "owner" })
      .returning();
    return { family, user };
  });
}

export function listFamilyMembers(familyId: number) {
  return db.query.users.findMany({
    where: eq(users.familyId, familyId),
    columns: { id: true, name: true, email: true, role: true },
    orderBy: [users.id],
  });
}

export async function updateMemberRole(familyId: number, targetUserId: number, role: (typeof userRoleEnum.enumValues)[number]) {
  const [updated] = await db
    .update(users)
    .set({ role })
    .where(and(eq(users.id, targetUserId), eq(users.familyId, familyId)))
    .returning();
  if (!updated) throw new Error("Couldn't find that family member.");
  return updated;
}

// Links a Google account to an existing member (matched by name) so their author history
// stays attached to the same user row, or creates a new member if no name match exists.
export async function linkOrJoinFamilyMember(input: { familyId: number; name: string; email: string }) {
  const existing = await getFamilyMemberByName(input.familyId, input.name);
  if (existing) {
    const [updated] = await db.update(users).set({ email: input.email }).where(eq(users.id, existing.id)).returning();
    return updated;
  }

  const [user] = await db
    .insert(users)
    .values({ familyId: input.familyId, email: input.email, name: input.name })
    .returning();
  return user;
}

type Audience = (typeof audienceEnum.enumValues)[number];

export async function listJournalEntries(familyId: number, audience?: Audience) {
  const rows = await db.query.journalEntries.findMany({
    where: and(
      eq(journalEntries.familyId, familyId),
      eq(journalEntries.isDraft, false),
      audience ? eq(journalEntries.audience, audience) : undefined,
    ),
    orderBy: [desc(journalEntries.entryDate), desc(journalEntries.id)],
    with: {
      author: true,
      photos: true,
      entryChildren: { with: { child: true } },
      comments: { with: { author: true }, orderBy: (comments, { asc }) => [asc(comments.createdAt)] },
    },
  });
  return rows.map(({ entryChildren, ...e }) => ({ ...e, children: entryChildren.map((ec) => ec.child) }));
}

export type JournalEntryWithPhotos = Awaited<ReturnType<typeof listJournalEntries>>[number];

// Returns childIds (not full Child rows) since the only consumer is DraftEntryData/EntryForm,
// which just needs to re-seed its multi-select state when resuming a draft.
export async function listMyDrafts(familyId: number, authorId: number) {
  const rows = await db.query.journalEntries.findMany({
    where: and(
      eq(journalEntries.familyId, familyId),
      eq(journalEntries.authorId, authorId),
      eq(journalEntries.isDraft, true),
    ),
    orderBy: [desc(journalEntries.updatedAt)],
    with: { photos: true, entryChildren: true },
  });
  return rows.map(({ entryChildren, ...e }) => ({ ...e, childIds: entryChildren.map((ec) => ec.childId) }));
}

export async function listEntryDates(familyId: number, audience?: Audience): Promise<string[]> {
  const rows = await db
    .select({ entryDate: journalEntries.entryDate })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.familyId, familyId),
        eq(journalEntries.isDraft, false),
        audience ? eq(journalEntries.audience, audience) : undefined,
      ),
    );
  return rows.map((r) => r.entryDate);
}

export async function getJournalEntryChildren(entryId: number) {
  const rows = await db.query.journalEntryChildren.findMany({
    where: eq(journalEntryChildren.entryId, entryId),
    with: { child: true },
  });
  return rows.map((r) => r.child);
}

export async function createComment(input: {
  entryId: number;
  familyId: number;
  authorId: number;
  body: string;
}) {
  const entry = await db.query.journalEntries.findFirst({
    where: and(eq(journalEntries.id, input.entryId), eq(journalEntries.familyId, input.familyId)),
    columns: { id: true, audience: true },
    with: { entryChildren: { with: { child: true } } },
  });
  if (!entry) throw new Error("Entry not found");

  const [comment] = await db
    .insert(comments)
    .values({ entryId: input.entryId, authorId: input.authorId, body: input.body })
    .returning();
  return { ...comment, audience: entry.audience, children: entry.entryChildren.map((ec) => ec.child) };
}

export type PhotoInput = { url: string; sizeBytes?: number };

export async function createJournalEntry(input: {
  familyId: number;
  authorId: number;
  audience: Audience;
  childIds?: number[];
  entryDate: string;
  title?: string;
  body: string;
  milestoneCategory?: (typeof milestoneCategoryEnum.enumValues)[number];
  milestoneLabel?: string;
  photos?: PhotoInput[];
  voiceMemoUrl?: string;
  videoUrl?: string;
  videoSizeBytes?: number;
  isDraft?: boolean;
}) {
  const [entry] = await db
    .insert(journalEntries)
    .values({
      familyId: input.familyId,
      authorId: input.authorId,
      audience: input.audience,
      entryDate: input.entryDate,
      title: input.title || null,
      body: input.body,
      milestoneCategory: input.milestoneCategory || null,
      milestoneLabel: input.milestoneLabel || null,
      voiceMemoUrl: input.voiceMemoUrl || null,
      videoUrl: input.videoUrl || null,
      videoSizeBytes: input.videoSizeBytes ?? null,
      isDraft: input.isDraft ?? false,
    })
    .returning();

  if (input.childIds?.length) {
    await db
      .insert(journalEntryChildren)
      .values(input.childIds.map((childId) => ({ entryId: entry.id, childId })));
  }

  if (input.photos?.length) {
    await db
      .insert(photos)
      .values(input.photos.map((p) => ({ entryId: entry.id, url: p.url, sizeBytes: p.sizeBytes ?? null })));
  }

  return entry;
}

export async function updateJournalEntry(
  entryId: number,
  familyId: number,
  authorId: number,
  patch: {
    entryDate: string;
    title?: string;
    body: string;
    milestoneCategory?: (typeof milestoneCategoryEnum.enumValues)[number];
    milestoneLabel?: string;
    photos?: PhotoInput[];
    voiceMemoUrl?: string | null;
    videoUrl?: string | null;
    videoSizeBytes?: number | null;
    isDraft?: boolean;
  },
) {
  return db.transaction(async (tx) => {
    const [entry] = await tx
      .update(journalEntries)
      .set({
        entryDate: patch.entryDate,
        title: patch.title || null,
        body: patch.body,
        milestoneCategory: patch.milestoneCategory || null,
        milestoneLabel: patch.milestoneLabel || null,
        updatedAt: new Date(),
        ...(patch.isDraft !== undefined ? { isDraft: patch.isDraft } : {}),
        ...(patch.voiceMemoUrl !== undefined ? { voiceMemoUrl: patch.voiceMemoUrl } : {}),
        ...(patch.videoUrl !== undefined
          ? { videoUrl: patch.videoUrl, videoSizeBytes: patch.videoSizeBytes ?? null }
          : {}),
      })
      .where(
        and(
          eq(journalEntries.id, entryId),
          eq(journalEntries.familyId, familyId),
          eq(journalEntries.authorId, authorId),
        ),
      )
      .returning();

    if (entry && patch.photos !== undefined) {
      await tx.delete(photos).where(eq(photos.entryId, entryId));
      if (patch.photos.length) {
        await tx
          .insert(photos)
          .values(patch.photos.map((p) => ({ entryId, url: p.url, sizeBytes: p.sizeBytes ?? null })));
      }
    }

    return entry;
  });
}

export async function deleteJournalEntry(entryId: number, familyId: number, authorId: number) {
  const entry = await db.query.journalEntries.findFirst({
    where: and(
      eq(journalEntries.id, entryId),
      eq(journalEntries.familyId, familyId),
      eq(journalEntries.authorId, authorId),
    ),
    columns: { id: true },
  });
  if (!entry) return false;

  await db.delete(photos).where(eq(photos.entryId, entryId));
  await db.delete(comments).where(eq(comments.entryId, entryId));
  await db.delete(journalEntryChildren).where(eq(journalEntryChildren.entryId, entryId));
  await db.delete(journalEntries).where(eq(journalEntries.id, entryId));
  return true;
}

export async function getOnThisDayEntries(familyId: number, month: number, day: number, audience?: Audience) {
  const rows = await db.query.journalEntries.findMany({
    where: and(
      eq(journalEntries.familyId, familyId),
      eq(journalEntries.isDraft, false),
      audience ? eq(journalEntries.audience, audience) : undefined,
      sql`extract(month from ${journalEntries.entryDate}) = ${month}`,
      sql`extract(day from ${journalEntries.entryDate}) = ${day}`,
      sql`extract(year from ${journalEntries.entryDate}) < extract(year from current_date)`,
    ),
    orderBy: [desc(journalEntries.entryDate)],
    with: {
      author: true,
      photos: true,
      entryChildren: { with: { child: true } },
      comments: { with: { author: true }, orderBy: (comments, { asc }) => [asc(comments.createdAt)] },
    },
  });
  return rows.map(({ entryChildren, ...e }) => ({ ...e, children: entryChildren.map((ec) => ec.child) }));
}

export async function getFamilySettings(familyId: number) {
  const family = await db.query.families.findFirst({
    where: eq(families.id, familyId),
    columns: { timezone: true, inviteCode: true, name: true },
  });
  if (!family) throw new Error("Family not found");
  return family;
}

export async function updateFamilySettings(familyId: number, patch: { timezone: string }) {
  await db.update(families).set(patch).where(eq(families.id, familyId));
}

export async function getFamilyStorageUsage(familyId: number): Promise<number> {
  const [[photoRow], [videoRow]] = await Promise.all([
    db
      .select({ totalBytes: sql<string>`coalesce(sum(${photos.sizeBytes}), 0)` })
      .from(photos)
      .innerJoin(journalEntries, eq(journalEntries.id, photos.entryId))
      .where(eq(journalEntries.familyId, familyId)),
    db
      .select({ totalBytes: sql<string>`coalesce(sum(${journalEntries.videoSizeBytes}), 0)` })
      .from(journalEntries)
      .where(eq(journalEntries.familyId, familyId)),
  ]);
  return Number(photoRow?.totalBytes ?? 0) + Number(videoRow?.totalBytes ?? 0);
}

export async function getFamilyBilling(familyId: number) {
  const family = await db.query.families.findFirst({
    where: eq(families.id, familyId),
    columns: {
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      subscriptionStatus: true,
      subscriptionRenewsAt: true,
      storageAddonBytes: true,
      isTrial: true,
    },
  });
  if (!family) throw new Error("Family not found");
  return family;
}

export type FamilyBilling = Awaited<ReturnType<typeof getFamilyBilling>>;

export function getFamilyByStripeCustomerId(customerId: string) {
  return db.query.families.findFirst({ where: eq(families.stripeCustomerId, customerId) });
}

export async function updateFamilyBilling(
  familyId: number,
  patch: Partial<{
    stripeCustomerId: string;
    stripeSubscriptionId: string | null;
    subscriptionStatus: (typeof subscriptionStatusEnum.enumValues)[number];
    subscriptionRenewsAt: Date | null;
  }>,
) {
  await db.update(families).set(patch).where(eq(families.id, familyId));
}

export async function incrementStorageAddon(familyId: number, bytes: number) {
  await db
    .update(families)
    .set({ storageAddonBytes: sql`${families.storageAddonBytes} + ${bytes}` })
    .where(eq(families.id, familyId));
}

// Free-tier families see interstitial ads (frequency controlled client-side by tap count);
// paid/trial/complimentary families never do. Client asks this once per threshold reached,
// not per tap, so it stays a cheap single lookup rather than a per-tap round trip.
export async function isFamilyPaid(familyId: number): Promise<boolean> {
  const family = await db.query.families.findFirst({
    where: eq(families.id, familyId),
    columns: { subscriptionStatus: true },
  });
  return !!family && isPaidStatus(family.subscriptionStatus);
}

export async function savePushSubscription(input: {
  userId: number;
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  await db
    .insert(pushSubscriptions)
    .values(input)
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { userId: input.userId, p256dh: input.p256dh, auth: input.auth },
    });
}

export async function deletePushSubscription(endpoint: string) {
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}

// Writes one row per other family member so the in-app bell has a history even for members
// without (or with an expired) push subscription — called alongside notifyFamily(), not instead of it.
export async function createNotificationsForFamily(
  familyId: number,
  actorId: number,
  payload: { title: string; body: string; url?: string },
) {
  const members = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.familyId, familyId), ne(users.id, actorId)));
  if (members.length === 0) return;

  await db.insert(notifications).values(
    members.map((m) => ({
      familyId,
      recipientId: m.id,
      actorId,
      title: payload.title,
      body: payload.body,
      url: payload.url,
    })),
  );
}

export async function listNotifications(userId: number, limit = 20) {
  return db.query.notifications.findMany({
    where: eq(notifications.recipientId, userId),
    orderBy: [desc(notifications.createdAt)],
    limit,
  });
}

export async function countUnreadNotifications(userId: number): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.recipientId, userId), isNull(notifications.readAt)));
  return row?.count ?? 0;
}

export async function markNotificationRead(notificationId: number, userId: number) {
  await db
    .update(notifications)
    .set({ readAt: sql`now()` })
    .where(and(eq(notifications.id, notificationId), eq(notifications.recipientId, userId), isNull(notifications.readAt)));
}

export async function markAllNotificationsRead(userId: number) {
  await db
    .update(notifications)
    .set({ readAt: sql`now()` })
    .where(and(eq(notifications.recipientId, userId), isNull(notifications.readAt)));
}

export async function listOtherFamilyPushSubscriptions(familyId: number, excludeUserId: number) {
  return db
    .select({
      id: pushSubscriptions.id,
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
    })
    .from(pushSubscriptions)
    .innerJoin(users, eq(users.id, pushSubscriptions.userId))
    .where(and(eq(users.familyId, familyId), ne(pushSubscriptions.userId, excludeUserId)));
}

export async function getFamilyDeletionSummary(familyId: number) {
  const family = await db.query.families.findFirst({
    where: eq(families.id, familyId),
    columns: { name: true },
  });
  if (!family) throw new Error("Family not found");

  const [[childrenCount], [entriesCount], [photosCount], [usersCount]] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(children).where(eq(children.familyId, familyId)),
    db.select({ count: sql<number>`count(*)::int` }).from(journalEntries).where(eq(journalEntries.familyId, familyId)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(photos)
      .innerJoin(journalEntries, eq(journalEntries.id, photos.entryId))
      .where(eq(journalEntries.familyId, familyId)),
    db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.familyId, familyId)),
  ]);

  return {
    familyName: family.name,
    children: childrenCount.count,
    entries: entriesCount.count,
    photos: photosCount.count,
    users: usersCount.count,
  };
}

// Permanently deletes a family and everything under it (children, entries, photos, comments,
// users, push subscriptions). Returns the blob URLs (photos + voice memos + videos) so the caller can
// delete the actual files after this transaction commits — file deletion isn't transactional.
export async function deleteFamilyAccount(familyId: number): Promise<string[]> {
  return db.transaction(async (tx) => {
    const entryRows = await tx
      .select({ id: journalEntries.id, voiceMemoUrl: journalEntries.voiceMemoUrl, videoUrl: journalEntries.videoUrl })
      .from(journalEntries)
      .where(eq(journalEntries.familyId, familyId));
    const entryIds = entryRows.map((e) => e.id);

    const photoRows = entryIds.length
      ? await tx.select({ url: photos.url }).from(photos).where(inArray(photos.entryId, entryIds))
      : [];

    const userRows = await tx.select({ id: users.id }).from(users).where(eq(users.familyId, familyId));
    const userIds = userRows.map((u) => u.id);

    if (entryIds.length) {
      await tx.delete(comments).where(inArray(comments.entryId, entryIds));
      await tx.delete(photos).where(inArray(photos.entryId, entryIds));
      await tx.delete(journalEntryChildren).where(inArray(journalEntryChildren.entryId, entryIds));
    }
    await tx.delete(journalEntries).where(eq(journalEntries.familyId, familyId));
    await tx.delete(children).where(eq(children.familyId, familyId));
    if (userIds.length) {
      await tx.delete(pushSubscriptions).where(inArray(pushSubscriptions.userId, userIds));
    }
    await tx.delete(users).where(eq(users.familyId, familyId));
    await tx.delete(families).where(eq(families.id, familyId));

    return [
      ...photoRows.map((p) => p.url),
      ...entryRows.map((e) => e.voiceMemoUrl).filter((url): url is string => !!url),
      ...entryRows.map((e) => e.videoUrl).filter((url): url is string => !!url),
    ];
  });
}

export async function listMilestoneEntries(familyId: number) {
  const rows = await db.query.journalEntries.findMany({
    where: and(
      eq(journalEntries.familyId, familyId),
      eq(journalEntries.isDraft, false),
      eq(journalEntries.audience, "child"),
      isNotNull(journalEntries.milestoneCategory),
    ),
    orderBy: [desc(journalEntries.entryDate)],
    with: {
      author: true,
      photos: true,
      entryChildren: { with: { child: true } },
      comments: { with: { author: true }, orderBy: (comments, { asc }) => [asc(comments.createdAt)] },
    },
  });
  return rows.map(({ entryChildren, ...e }) => ({ ...e, children: entryChildren.map((ec) => ec.child) }));
}

export async function listAllFamiliesForAdmin() {
  const [familyRows, userRows] = await Promise.all([
    db.select().from(families).orderBy(desc(families.createdAt)),
    db.select({ familyId: users.familyId, email: users.email, name: users.name }).from(users),
  ]);

  const membersByFamily = new Map<number, { email: string; name: string | null }[]>();
  for (const u of userRows) {
    const list = membersByFamily.get(u.familyId) ?? [];
    list.push({ email: u.email, name: u.name });
    membersByFamily.set(u.familyId, list);
  }

  return familyRows.map((f) => ({ ...f, members: membersByFamily.get(f.id) ?? [] }));
}

export type AdminFamilyRow = Awaited<ReturnType<typeof listAllFamiliesForAdmin>>[number];

// Grants free Pro access without a real Stripe subscription. Deliberately leaves
// stripeCustomerId/stripeSubscriptionId untouched — their absence (or presence, for a family
// that once had a real subscription) is what distinguishes complimentary access from a real
// one in the billing UI. expiresAt null means it never expires.
export async function setComplimentaryAccess(familyId: number, expiresAt: Date | null, isTrial = false) {
  await db
    .update(families)
    .set({ subscriptionStatus: "active", subscriptionRenewsAt: expiresAt, isTrial })
    .where(eq(families.id, familyId));
}

export async function revokeComplimentaryAccess(familyId: number) {
  await db
    .update(families)
    .set({ subscriptionStatus: "free", subscriptionRenewsAt: null, isTrial: false })
    .where(eq(families.id, familyId));
}

// Auto-downgrades expired complimentary grants (including expired signup trials) back to Free.
// Only touches families with no real Stripe subscription behind their "active" status, so it
// can never cancel a real payer.
export async function expireComplimentaryAccess(): Promise<number> {
  const result = await db
    .update(families)
    .set({ subscriptionStatus: "free", subscriptionRenewsAt: null, isTrial: false })
    .where(
      and(
        eq(families.subscriptionStatus, "active"),
        isNull(families.stripeSubscriptionId),
        isNotNull(families.subscriptionRenewsAt),
        lt(families.subscriptionRenewsAt, new Date()),
      ),
    )
    .returning({ id: families.id });
  return result.length;
}
