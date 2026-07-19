import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "./index";
import { audienceEnum, comments, families, journalEntries, milestoneCategoryEnum, photos, users } from "./schema";

export async function getOrCreateUser(email: string, name?: string | null, imageUrl?: string | null) {
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) return existing;

  let family = await db.query.families.findFirst();
  if (!family) {
    [family] = await db
      .insert(families)
      .values({ name: process.env.FAMILY_NAME ?? "Our Family" })
      .returning();
  }

  const [user] = await db
    .insert(users)
    .values({ familyId: family.id, email, name, imageUrl })
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
      .where(and(eq(journalEntries.id, entryId), eq(journalEntries.familyId, familyId)))
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

export async function deleteJournalEntry(entryId: number, familyId: number) {
  await db.delete(photos).where(eq(photos.entryId, entryId));
  await db.delete(comments).where(eq(comments.entryId, entryId));
  await db
    .delete(journalEntries)
    .where(and(eq(journalEntries.id, entryId), eq(journalEntries.familyId, familyId)));
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
