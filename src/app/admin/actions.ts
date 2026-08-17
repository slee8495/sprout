"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import { listAllUserEmails, revokeComplimentaryAccess, setComplimentaryAccess } from "@/db/queries";
import { sendBulkEmail } from "@/lib/email";
import { announcementEmail } from "@/lib/emailTemplates";

async function requireAdmin() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) redirect("/");
}

const grantSchema = z.object({
  familyId: z.number(),
  days: z.number().nullable(),
});

export async function grantAccess(input: z.infer<typeof grantSchema>) {
  await requireAdmin();
  const parsed = grantSchema.parse(input);
  const expiresAt = parsed.days ? new Date(Date.now() + parsed.days * 24 * 60 * 60 * 1000) : null;
  await setComplimentaryAccess(parsed.familyId, expiresAt);
  revalidatePath("/admin");
}

export async function revokeAccess(familyId: number) {
  await requireAdmin();
  await revokeComplimentaryAccess(familyId);
  revalidatePath("/admin");
}

export async function countAnnouncementRecipients(): Promise<number> {
  await requireAdmin();
  const users = await listAllUserEmails();
  return users.length;
}

const announcementSchema = z.object({
  subject: z.string().trim().min(1),
  heading: z.string().trim().min(1),
  body: z.string().trim().min(1),
  ctaLabel: z.string().trim().optional(),
  ctaHref: z.string().trim().url().optional(),
});

// Sends one email per registered user — e.g. "we're in the App Store now" or a maintenance
// notice. No unsubscribe/preference gating exists for this (there's no marketing-vs-transactional
// split in this app yet) — send sparingly.
export async function sendAnnouncement(
  input: z.infer<typeof announcementSchema>,
): Promise<{ sent: number }> {
  await requireAdmin();
  const parsed = announcementSchema.parse(input);

  const recipients = await listAllUserEmails();
  const { subject, html } = announcementEmail(parsed);
  const sent = await sendBulkEmail({ to: recipients.map((u) => u.email), subject, html });

  return { sent };
}
