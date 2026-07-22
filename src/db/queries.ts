import { and, desc, eq, ilike, isNotNull, ne, sql } from "drizzle-orm";
import { db } from "./index";
import {
  audienceEnum,
  comments,
  dayCountStartEnum,
  families,
  journalEntries,
  milestoneCategoryEnum,
  photos,
  pushSubscriptions,
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

export async function createFamilyWithOwner(input: {
  familyName: string;
  ownerName: string;
  email: string;
  passphraseHash: string;
}) {
  return db.transaction(async (tx) => {
    let family: typeof families.$inferSelect | undefined;
    let lastError: unknown;
    for (let attempt = 0; attempt < 5 && !family; attempt++) {
      try {
        [family] = await tx
          .insert(families)
          .values({ name: input.familyName, inviteCode: generateInviteCode(), passphraseHash: input.passphraseHash })
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

export async function addFamilyMember(input: { familyId: number; name: string; email: string }) {
  const [user] = await db
    .insert(users)
    .values({ familyId: input.familyId, email: input.email, name: input.name })
    .returning();
  return user;
}

type Audience = (typeof audienceEnum.enumValues)[number];

export function listJournalEntries(familyId: number, audience?: Audience) {
  return db.query.journalEntries.findMany({
    where: and(eq(journalEntries.familyId, familyId), audience ? eq(journalEntries.audience, audience) : undefined),
    orderBy: [desc(journalEntries.entryDate), desc(journalEntries.id)],
    with: {
      author: true,
      photos: true,
      comments: { with: { author: true }, orderBy: (comments, { asc }) => [asc(comments.createdAt)] },
    },
  });
}

export type JournalEntryWithPhotos = Awaited<ReturnType<typeof listJournalEntries>>[number];

export async function listEntryDates(familyId: number, audience?: Audience): Promise<string[]> {
  const rows = await db
    .select({ entryDate: journalEntries.entryDate })
    .from(journalEntries)
    .where(and(eq(journalEntries.familyId, familyId), audience ? eq(journalEntries.audience, audience) : undefined));
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

export async function createJournalEntry(input: {
  familyId: number;
  authorId: number;
  audience: Audience;
  entryDate: string;
  title?: string;
  body: string;
  milestoneCategory?: (typeof milestoneCategoryEnum.enumValues)[number];
  milestoneLabel?: string;
  photoUrls?: string[];
  voiceMemoUrl?: string;
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
    })
    .returning();

  if (input.photoUrls?.length) {
    await db.insert(photos).values(input.photoUrls.map((url) => ({ entryId: entry.id, url })));
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
    photoUrls?: string[];
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
      })
      .where(
        and(
          eq(journalEntries.id, entryId),
          eq(journalEntries.familyId, familyId),
          eq(journalEntries.authorId, authorId),
        ),
      )
      .returning();

    if (entry && patch.photoUrls !== undefined) {
      await tx.delete(photos).where(eq(photos.entryId, entryId));
      if (patch.photoUrls.length) {
        await tx.insert(photos).values(patch.photoUrls.map((url) => ({ entryId, url })));
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

export function getOnThisDayEntries(familyId: number, month: number, day: number, audience?: Audience) {
  return db.query.journalEntries.findMany({
    where: and(
      eq(journalEntries.familyId, familyId),
      audience ? eq(journalEntries.audience, audience) : undefined,
      sql`extract(month from ${journalEntries.entryDate}) = ${month}`,
      sql`extract(day from ${journalEntries.entryDate}) = ${day}`,
      sql`extract(year from ${journalEntries.entryDate}) < extract(year from current_date)`,
    ),
    orderBy: [desc(journalEntries.entryDate)],
    with: {
      author: true,
      photos: true,
      comments: { with: { author: true }, orderBy: (comments, { asc }) => [asc(comments.createdAt)] },
    },
  });
}

export async function getFamilySettings(familyId: number) {
  const family = await db.query.families.findFirst({
    where: eq(families.id, familyId),
    columns: { timezone: true, birthDate: true, dayCountStart: true, inviteCode: true, name: true },
  });
  if (!family) throw new Error("Family not found");
  return family;
}

export async function updateFamilySettings(
  familyId: number,
  patch: { timezone: string; birthDate: string; dayCountStart: (typeof dayCountStartEnum.enumValues)[number] },
) {
  await db.update(families).set(patch).where(eq(families.id, familyId));
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

export function listMilestoneEntries(familyId: number) {
  return db.query.journalEntries.findMany({
    where: and(
      eq(journalEntries.familyId, familyId),
      eq(journalEntries.audience, "roun"),
      isNotNull(journalEntries.milestoneCategory),
    ),
    orderBy: [desc(journalEntries.entryDate)],
    with: {
      author: true,
      photos: true,
      comments: { with: { author: true }, orderBy: (comments, { asc }) => [asc(comments.createdAt)] },
    },
  });
}
