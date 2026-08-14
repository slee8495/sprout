import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  varchar,
  date,
  timestamp,
  integer,
  bigint,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

export const milestoneCategoryEnum = pgEnum("milestone_category", [
  "food",
  "social",
  "physical",
  "language",
  "health",
  "place",
  "special_day",
  "other",
]);

export const audienceEnum = pgEnum("audience", ["child", "parents"]);

export const dayCountStartEnum = pgEnum("day_count_start", ["zero", "one"]);

export const subjectTypeEnum = pgEnum("subject_type", ["child", "pet"]);

export const subscriptionStatusEnum = pgEnum("subscription_status", ["free", "active", "past_due", "canceled"]);

// "owner" is whoever created the family (or was promoted to it); only owners can manage other
// members' roles and delete the family. "viewer" is read-only — no entries, comments, kids/pets,
// or family settings. "editor" is today's baseline behavior (full read/write, no member management).
export const userRoleEnum = pgEnum("user_role", ["owner", "editor", "viewer"]);

export const families = pgTable("families", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  timezone: varchar("timezone", { length: 64 }).notNull().default("America/Los_Angeles"),
  birthDate: date("birth_date"),
  dayCountStart: dayCountStartEnum("day_count_start").notNull().default("zero"),
  inviteCode: varchar("invite_code", { length: 16 }).notNull().unique(),
  passphraseHash: text("passphrase_hash"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status").notNull().default("free"),
  subscriptionRenewsAt: timestamp("subscription_renews_at", { withTimezone: true }),
  // True only while subscriptionRenewsAt reflects the automatic signup trial, not an admin-granted comp — controls BillingCard copy.
  isTrial: boolean("is_trial").notNull().default(false),
  storageAddonBytes: bigint("storage_addon_bytes", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull().references(() => families.id),
  email: varchar("email", { length: 256 }).notNull().unique(),
  name: varchar("name", { length: 128 }),
  imageUrl: text("image_url"),
  role: userRoleEnum("role").notNull().default("editor"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Despite the table name, this also holds pets — `type` discriminates display only.
export const children = pgTable("children", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull().references(() => families.id),
  name: varchar("name", { length: 128 }).notNull(),
  type: subjectTypeEnum("type").notNull().default("child"),
  birthDate: date("birth_date"),
  dayCountStart: dayCountStartEnum("day_count_start").notNull().default("zero"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull().references(() => families.id),
  authorId: integer("author_id").notNull().references(() => users.id),
  childId: integer("child_id").references(() => children.id),
  audience: audienceEnum("audience").notNull().default("child"),
  entryDate: date("entry_date").notNull(),
  title: varchar("title", { length: 256 }),
  body: text("body").notNull(),
  milestoneCategory: milestoneCategoryEnum("milestone_category"),
  milestoneLabel: varchar("milestone_label", { length: 128 }),
  voiceMemoUrl: text("voice_memo_url"),
  videoUrl: text("video_url"),
  videoSizeBytes: integer("video_size_bytes"),
  isDraft: boolean("is_draft").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").notNull().references(() => journalEntries.id),
  url: text("url").notNull(),
  caption: text("caption"),
  sizeBytes: integer("size_bytes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").notNull().references(() => journalEntries.id),
  authorId: integer("author_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// In-app notification history — separate from (and always written alongside) the fire-and-forget
// web push in src/lib/push.ts, so the bell icon has something to show even for members who never
// enabled push or whose push subscription has since expired.
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull().references(() => families.id),
  recipientId: integer("recipient_id").notNull().references(() => users.id),
  actorId: integer("actor_id").notNull().references(() => users.id),
  title: varchar("title", { length: 256 }).notNull(),
  body: text("body").notNull(),
  url: text("url"),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const journalEntriesRelations = relations(journalEntries, ({ many, one }) => ({
  photos: many(photos),
  comments: many(comments),
  author: one(users, { fields: [journalEntries.authorId], references: [users.id] }),
  child: one(children, { fields: [journalEntries.childId], references: [children.id] }),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  entry: one(journalEntries, { fields: [photos.entryId], references: [journalEntries.id] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  entry: one(journalEntries, { fields: [comments.entryId], references: [journalEntries.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, { fields: [pushSubscriptions.userId], references: [users.id] }),
}));
