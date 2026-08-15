import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { AlbumPdfDocument } from "@/app/api/library/[childId]/export/AlbumPdfDocument";
import { listAllFamiliesForAdmin, listChildren, listJournalEntries } from "@/db/queries";
import { buildAlbumPages, sortAlbumEntries } from "@/lib/albumPages";
import { sendEmail } from "@/lib/email";
import { monthlyAlbumEmail } from "@/lib/emailTemplates";
import { formatMonthLabel } from "@/lib/milestones";
import { preparePhotosForPdf } from "@/lib/pdfPhotos";

export const runtime = "nodejs";
// Sequential per-family/per-child PDF generation — fine at today's scale (see maxDuration on the
// on-demand export route for the same per-PDF cost). Revisit with a queue if the family count
// ever makes one run risk this ceiling.
export const maxDuration = 300;

const APP_URL = "https://roun.sl-studio.dev";

function previousMonthRange(now = new Date()) {
  const firstOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const firstOfLastMonth = new Date(Date.UTC(firstOfThisMonth.getUTCFullYear(), firstOfThisMonth.getUTCMonth() - 1, 1));
  const lastOfLastMonth = new Date(firstOfThisMonth.getTime() - 1);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(firstOfLastMonth), to: iso(lastOfLastMonth) };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { from, to } = previousMonthRange();
  const monthLabel = formatMonthLabel(from);

  const families = await listAllFamiliesForAdmin();
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const family of families) {
    // Pro perk only — same "paid" definition BillingCard.tsx uses (active or past_due; includes
    // admin-granted complimentary Pro, since that's still Pro-tier access, not a real-payer check).
    const isPaid = family.subscriptionStatus === "active" || family.subscriptionStatus === "past_due";
    if (!isPaid || family.members.length === 0) continue;

    try {
      const [children, entries] = await Promise.all([
        listChildren(family.id),
        listJournalEntries(family.id, "child"),
      ]);

      const innerEmails = family.members.filter((m) => m.tier !== "extended").map((m) => m.email);
      const extendedEmails = family.members.filter((m) => m.tier === "extended").map((m) => m.email);

      for (const child of children) {
        const photoEntries = entries.filter(
          (e) => e.photos.length > 0 && e.children.some((c) => c.id === child.id) && e.entryDate >= from && e.entryDate <= to,
        );
        if (photoEntries.length === 0) {
          skipped++;
          continue;
        }
        const filename = `${child.name.replace(/[^a-z0-9]+/gi, "_")}-${from.slice(0, 7)}.pdf`;

        // "Inner" members get everything; "extended" members only get entries not marked 🔒 Just
        // us — two separate PDFs/sends when both groups exist, so a restricted entry never rides
        // along in an attachment that reaches an extended-tier inbox.
        if (innerEmails.length) {
          const pages = buildAlbumPages(sortAlbumEntries(photoEntries));
          const pdfPages = await preparePhotosForPdf(pages);
          const buffer = await renderToBuffer(<AlbumPdfDocument child={child} pages={pdfPages} />);
          await sendEmail({
            to: innerEmails,
            ...monthlyAlbumEmail({ childName: child.name, monthLabel, appUrl: APP_URL }),
            attachments: [{ filename, content: buffer }],
          });
          sent++;
        }

        if (extendedEmails.length) {
          const everyoneEntries = photoEntries.filter((e) => e.visibility === "everyone");
          if (everyoneEntries.length) {
            const pages = buildAlbumPages(sortAlbumEntries(everyoneEntries));
            const pdfPages = await preparePhotosForPdf(pages);
            const buffer = await renderToBuffer(<AlbumPdfDocument child={child} pages={pdfPages} />);
            await sendEmail({
              to: extendedEmails,
              ...monthlyAlbumEmail({ childName: child.name, monthLabel, appUrl: APP_URL }),
              attachments: [{ filename, content: buffer }],
            });
            sent++;
          }
        }
      }
    } catch {
      // One family's failure (a bad photo URL, a Resend hiccup) shouldn't stop the rest of the run.
      failed++;
    }
  }

  return NextResponse.json({ month: monthLabel, sent, skipped, failed });
}
