import { and, desc, eq, ilike, inArray, isNotNull, ne, sql } from "drizzle-orm";
import { db } from "./index";
import {
  audienceEnum,
  children,
  comments,
  dayCountStartEnum,
  families,
  journalEntries,
  milestoneCategoryEnum,
  photos,
  pushSubscriptions,
  subjectTypeEnum,
  subscriptionStatusEnum,
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

export async function getUserByEmail(email: string) {
  return db.query.users.findFirst({ where: eq(users.email, email) });
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
}) {
  const [child] = await db
    .insert(children)
    .values({
      familyId: input.familyId,
      name: input.name,
      type: input.type ?? "child",
      birthDate: input.birthDate || null,
      dayCountStart: input.dayCountStart ?? "zero",
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
  },
) {
  const [child] = await db
    .update(children)
    .set(patch)
    .where(and(eq(children.id, childId), eq(children.familyId, familyId)))
    .returning();
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
      .values({ familyId: family.id, email: input.email, name: input.ownerName })
      .returning();
    return { family, user };
  });
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

export function listJournalEntries(familyId: number, audience?: Audience, childId?: number) {
  return db.query.journalEntries.findMany({
    where: and(
      eq(journalEntries.familyId, familyId),
      eq(journalEntries.isDraft, false),
      audience ? eq(journalEntries.audience, audience) : undefined,
      childId ? eq(journalEntries.childId, childId) : undefined,
    ),
    orderBy: [desc(journalEntries.entryDate), desc(journalEntries.id)],
    with: {
      author: true,
      photos: true,
      child: true,
      comments: { with: { author: true }, orderBy: (comments, { asc }) => [asc(comments.createdAt)] },
    },
  });
}

export type JournalEntryWithPhotos = Awaited<ReturnType<typeof listJournalEntries>>[number];

export function listMyDrafts(familyId: number, authorId: number) {
  return db.query.journalEntries.findMany({
    where: and(
      eq(journalEntries.familyId, familyId),
      eq(journalEntries.authorId, authorId),
      eq(journalEntries.isDraft, true),
    ),
    orderBy: [desc(journalEntries.updatedAt)],
    with: { photos: true, child: true },
  });
}

export async function listEntryDates(familyId: number, audience?: Audience, childId?: number): Promise<string[]> {
  const rows = await db
    .select({ entryDate: journalEntries.entryDate })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.familyId, familyId),
        eq(journalEntries.isDraft, false),
        audience ? eq(journalEntries.audience, audience) : undefined,
        childId ? eq(journalEntries.childId, childId) : undefined,
      ),
    );
  return rows.map((r) => r.entryDate);
}

export async function createComment(input: {
  entryId: number;
  familyId: number;
  authorId: number;
  body: string;
}) {
  const entry = await db.query.journalEntries.findFirst({
    where: and(eq(journalEntries.id, input.entryId), eq(journalEntries.familyId, input.familyId)),
    columns: { id: true },
  });
  if (!entry) throw new Error("Entry not found");

  const [comment] = await db
    .insert(comments)
    .values({ entryId: input.entryId, authorId: input.authorId, body: input.body })
    .returning();
  return comment;
}

export type PhotoInput = { url: string; sizeBytes?: number };

export async function createJournalEntry(input: {
  familyId: number;
  authorId: number;
  audience: Audience;
  childId?: number;
  entryDate: string;
  title?: string;
  body: string;
  milestoneCategory?: (typeof milestoneCategoryEnum.enumValues)[number];
  milestoneLabel?: string;
  photos?: PhotoInput[];
  voiceMemoUrl?: string;
  isDraft?: boolean;
}) {
  const [entry] = await db
    .insert(journalEntries)
    .values({
      familyId: input.familyId,
      authorId: input.authorId,
      audience: input.audience,
      childId: input.childId ?? null,
      entryDate: input.entryDate,
      title: input.title || null,
      body: input.body,
      milestoneCategory: input.milestoneCategory || null,
      milestoneLabel: input.milestoneLabel || null,
      voiceMemoUrl: input.voiceMemoUrl || null,
      isDraft: input.isDraft ?? false,
    })
    .returning();

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
  await db.delete(journalEntries).where(eq(journalEntries.id, entryId));
  return true;
}

export function getOnThisDayEntries(familyId: number, month: number, day: number, audience?: Audience, childId?: number) {
  return db.query.journalEntries.findMany({
    where: and(
      eq(journalEntries.familyId, familyId),
      eq(journalEntries.isDraft, false),
      audience ? eq(journalEntries.audience, audience) : undefined,
      childId ? eq(journalEntries.childId, childId) : undefined,
      sql`extract(month from ${journalEntries.entryDate}) = ${month}`,
      sql`extract(day from ${journalEntries.entryDate}) = ${day}`,
      sql`extract(year from ${journalEntries.entryDate}) < extract(year from current_date)`,
    ),
    orderBy: [desc(journalEntries.entryDate)],
    with: {
      author: true,
      photos: true,
      child: true,
      comments: { with: { author: true }, orderBy: (comments, { asc }) => [asc(comments.createdAt)] },
    },
  });
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
  const [row] = await db
    .select({ totalBytes: sql<string>`coalesce(sum(${photos.sizeBytes}), 0)` })
    .from(photos)
    .innerJoin(journalEntries, eq(journalEntries.id, photos.entryId))
    .where(eq(journalEntries.familyId, familyId));
  return Number(row?.totalBytes ?? 0);
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
// users, push subscriptions). Returns the blob URLs (photos + voice memos) so the caller can
// delete the actual files after this transaction commits — file deletion isn't transactional.
export async function deleteFamilyAccount(familyId: number): Promise<string[]> {
  return db.transaction(async (tx) => {
    const entryRows = await tx
      .select({ id: journalEntries.id, voiceMemoUrl: journalEntries.voiceMemoUrl })
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
    ];
  });
}

export function listMilestoneEntries(familyId: number, childId?: number) {
  return db.query.journalEntries.findMany({
    where: and(
      eq(journalEntries.familyId, familyId),
      eq(journalEntries.isDraft, false),
      eq(journalEntries.audience, "child"),
      childId ? eq(journalEntries.childId, childId) : undefined,
      isNotNull(journalEntries.milestoneCategory),
    ),
    orderBy: [desc(journalEntries.entryDate)],
    with: {
      author: true,
      photos: true,
      child: true,
      comments: { with: { author: true }, orderBy: (comments, { asc }) => [asc(comments.createdAt)] },
    },
  });
}
