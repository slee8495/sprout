import { Resend } from "resend";
import type { Locale } from "./i18n";

let resendClient: Resend | undefined;

function getResend(): Resend {
  return (resendClient ??= new Resend(process.env.RESEND_API_KEY));
}

export async function sendEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer }[];
}) {
  const domain = process.env.RESEND_EMAIL_DOMAIN;
  if (!domain) return; // Not configured (e.g. local dev without Resend env vars) — skip silently.

  await getResend().emails.send({
    from: `Roun <no-reply@${domain}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
    attachments: input.attachments,
  });
}

// For sending the same email to many separate recipients (e.g. a site-wide announcement).
// Sends one message per recipient — never puts multiple real users' addresses in the same `to`
// array, which would leak each recipient's email to every other recipient. Uses Resend's batch
// endpoint (max 100 emails/call, no attachments) so N recipients cost ceil(N/100) API calls
// instead of N.
export async function sendBulkEmail(input: { to: string[]; subject: string; html: string }): Promise<number> {
  const domain = process.env.RESEND_EMAIL_DOMAIN;
  if (!domain) return 0; // Not configured (e.g. local dev without Resend env vars) — skip silently.

  const from = `Roun <no-reply@${domain}>`;
  const BATCH_SIZE = 100;
  let sent = 0;

  for (let i = 0; i < input.to.length; i += BATCH_SIZE) {
    const chunk = input.to.slice(i, i + BATCH_SIZE);
    await getResend().batch.send(chunk.map((to) => ({ from, to, subject: input.subject, html: input.html })));
    sent += chunk.length;
  }

  return sent;
}

// Splits a family's members by their saved language, so a locale-aware email template (see
// emailTemplates.ts) can be rendered once per language instead of once per recipient — each
// group still gets a single `sendEmail` call with everyone in that language in the `to` array,
// same as before locale existed.
export function groupByLocale<T extends { locale: Locale }>(members: T[]): Partial<Record<Locale, T[]>> {
  const groups: Partial<Record<Locale, T[]>> = {};
  for (const member of members) {
    (groups[member.locale] ??= []).push(member);
  }
  return groups;
}
