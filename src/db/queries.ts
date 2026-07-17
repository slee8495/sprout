import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "./index";
import {
  comments,
  families,
  growthMeasurements,
  journalEntries,
  milestoneEnum,
  photos,
  timeCapsules,
  users,
} from "./schema";

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

export function listJournalEntries(familyId: number) {
  return db.query.journalEntries.findMany({
    where: eq(journalEntries.familyId, familyId),
    orderBy: [desc(journalEntries.entryDate), desc(journalEntries.id)],
    with: {
      photos: true,
      comments: { with: { author: true }, orderBy: (comments, { asc }) => [asc(comments.createdAt)] },
    },
  });
}

export type JournalEntryWithPhotos = Awaited<ReturnType<typeof listJournalEntries>>[number];

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
  entryDate: string;
  title?: string;
  body: string;
  milestoneType?: (typeof milestoneEnum.enumValues)[number];
  milestoneLabel?: string;
  photoUrls?: string[];
  voiceMemoUrl?: string;
}) {
  const [entry] = await db
    .insert(journalEntries)
    .values({
      familyId: input.familyId,
      authorId: input.authorId,
      entryDate: input.entryDate,
      title: input.title || null,
      body: input.body,
      milestoneType: input.milestoneType || null,
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
    milestoneType?: (typeof milestoneEnum.enumValues)[number];
    milestoneLabel?: string;
  },
) {
  const [entry] = await db
    .update(journalEntries)
    .set({
      entryDate: patch.entryDate,
      title: patch.title || null,
      body: patch.body,
      milestoneType: patch.milestoneType || null,
      milestoneLabel: patch.milestoneLabel || null,
      updatedAt: new Date(),
    })
    .where(and(eq(journalEntries.id, entryId), eq(journalEntries.familyId, familyId)))
    .returning();

  return entry;
}

export async function deleteJournalEntry(entryId: number, familyId: number) {
  await db.delete(photos).where(eq(photos.entryId, entryId));
  await db.delete(comments).where(eq(comments.entryId, entryId));
  await db
    .delete(journalEntries)
    .where(and(eq(journalEntries.id, entryId), eq(journalEntries.familyId, familyId)));
}

export function getOnThisDayEntries(familyId: number, month: number, day: number) {
  return db.query.journalEntries.findMany({
    where: and(
      eq(journalEntries.familyId, familyId),
      sql`extract(month from ${journalEntries.entryDate}) = ${month}`,
      sql`extract(day from ${journalEntries.entryDate}) = ${day}`,
      sql`extract(year from ${journalEntries.entryDate}) < extract(year from current_date)`,
    ),
    orderBy: [desc(journalEntries.entryDate)],
    with: {
      photos: true,
      comments: { with: { author: true }, orderBy: (comments, { asc }) => [asc(comments.createdAt)] },
    },
  });
}

export function listMilestoneEntries(familyId: number) {
  return db.query.journalEntries.findMany({
    where: and(eq(journalEntries.familyId, familyId), isNotNull(journalEntries.milestoneType)),
    orderBy: [journalEntries.entryDate],
    with: {
      photos: true,
      comments: { with: { author: true }, orderBy: (comments, { asc }) => [asc(comments.createdAt)] },
    },
  });
}

export type GrowthMeasurement = Awaited<ReturnType<typeof listGrowthMeasurements>>[number];

export function listGrowthMeasurements(familyId: number) {
  return db.query.growthMeasurements.findMany({
    where: eq(growthMeasurements.familyId, familyId),
    orderBy: [growthMeasurements.measuredAt],
  });
}

export async function createGrowthMeasurement(input: {
  familyId: number;
  measuredAt: string;
  heightCm?: number;
  weightKg?: number;
}) {
  const [measurement] = await db
    .insert(growthMeasurements)
    .values({
      familyId: input.familyId,
      measuredAt: input.measuredAt,
      heightCm: input.heightCm != null ? String(input.heightCm) : null,
      weightKg: input.weightKg != null ? String(input.weightKg) : null,
    })
    .returning();
  return measurement;
}

export async function deleteGrowthMeasurement(id: number, familyId: number) {
  await db
    .delete(growthMeasurements)
    .where(and(eq(growthMeasurements.id, id), eq(growthMeasurements.familyId, familyId)));
}

export type TimeCapsule = Awaited<ReturnType<typeof listTimeCapsules>>[number];

export function listTimeCapsules(familyId: number) {
  return db.query.timeCapsules.findMany({
    where: eq(timeCapsules.familyId, familyId),
    orderBy: [timeCapsules.unlockDate],
    with: { author: true },
  });
}

export async function createTimeCapsule(input: {
  familyId: number;
  authorId: number;
  unlockDate: string;
  title?: string;
  body: string;
}) {
  const [capsule] = await db
    .insert(timeCapsules)
    .values({
      familyId: input.familyId,
      authorId: input.authorId,
      unlockDate: input.unlockDate,
      title: input.title || null,
      body: input.body,
    })
    .returning();
  return capsule;
}
