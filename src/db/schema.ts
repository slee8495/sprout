import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  varchar,
  date,
  timestamp,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";

export const milestoneCategoryEnum = pgEnum("milestone_category", [
  "food",
  "social",
  "physical",
  "language",
  "health",
  "place",
  "other",
]);

export const audienceEnum = pgEnum("audience", ["roun", "parents"]);

export const families = pgTable("families", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull().references(() => families.id),
  email: varchar("email", { length: 256 }).notNull().unique(),
  name: varchar("name", { length: 128 }),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull().references(() => families.id),
  authorId: integer("author_id").notNull().references(() => users.id),
  audience: audienceEnum("audience").notNull().default("roun"),
  entryDate: date("entry_date").notNull(),
  title: varchar("title", { length: 256 }),
  body: text("body").notNull(),
  milestoneCategory: milestoneCategoryEnum("milestone_category"),
  milestoneLabel: varchar("milestone_label", { length: 128 }),
  voiceMemoUrl: text("voice_memo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").notNull().references(() => journalEntries.id),
  url: text("url").notNull(),
  caption: text("caption"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").notNull().references(() => journalEntries.id),
  authorId: integer("author_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const journalEntriesRelations = relations(journalEntries, ({ many, one }) => ({
  photos: many(photos),
  comments: many(comments),
  author: one(users, { fields: [journalEntries.authorId], references: [users.id] }),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  entry: one(journalEntries, { fields: [photos.entryId], references: [journalEntries.id] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  entry: one(journalEntries, { fields: [comments.entryId], references: [journalEntries.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
}));
