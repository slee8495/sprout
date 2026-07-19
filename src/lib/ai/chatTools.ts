import { tool } from "ai";
import { z } from "zod";
import { and, eq, gte, lte, or, ilike } from "drizzle-orm";
import { db } from "@/db";
import { journalEntries, milestoneCategoryEnum } from "@/db/schema";

export const searchJournalEntries = tool({
  description:
    "Search Roun's journal entries by keyword and/or date range. Use this to answer questions " +
    "about what happened on or around specific dates, or to find entries mentioning something specific.",
  inputSchema: z.object({
    keyword: z.string().optional().describe("Text to search for in the entry title/body"),
    fromDate: z.string().optional().describe("ISO date (YYYY-MM-DD), inclusive lower bound"),
    toDate: z.string().optional().describe("ISO date (YYYY-MM-DD), inclusive upper bound"),
  }),
  execute: async ({ keyword, fromDate, toDate }) => {
    const conditions = [];
    if (keyword) {
      conditions.push(
        or(ilike(journalEntries.title, `%${keyword}%`), ilike(journalEntries.body, `%${keyword}%`)),
      );
    }
    if (fromDate) conditions.push(gte(journalEntries.entryDate, fromDate));
    if (toDate) conditions.push(lte(journalEntries.entryDate, toDate));

    return db
      .select()
      .from(journalEntries)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(journalEntries.entryDate)
      .limit(20);
  },
});

export const getMilestoneEntries = tool({
  description:
    "Get all journal entries tagged with a specific milestone category (food, social, physical, language, " +
    "health, place, other). Use this for 'when did Roun first ___' style questions.",
  inputSchema: z.object({
    milestoneCategory: z.enum(milestoneCategoryEnum.enumValues),
  }),
  execute: async ({ milestoneCategory }) => {
    return db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.milestoneCategory, milestoneCategory))
      .orderBy(journalEntries.entryDate);
  },
});
