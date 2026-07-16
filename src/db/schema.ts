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

export const milestoneEnum = pgEnum("milestone_type", [
  "first_smile",
  "first_laugh",
  "first_solid_food",
  "first_tooth",
  "first_word",
  "first_steps",
  "first_haircut",
  "other",
]);

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
  entryDate: date("entry_date").notNull(),
  title: varchar("title", { length: 256 }),
  body: text("body").notNull(),
  milestoneType: milestoneEnum("milestone_type"),
  milestoneLabel: varchar("milestone_label", { length: 128 }),
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
