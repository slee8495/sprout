import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";
import { getChild, listJournalEntries } from "@/db/queries";
import { buildAlbumPages, sortAlbumEntries } from "@/lib/albumPages";
import { preparePhotosForPdf } from "@/lib/pdfPhotos";
import { requireSession } from "@/lib/session";
import { AlbumPdfDocument } from "./AlbumPdfDocument";

export const runtime = "nodejs";
// react-pdf fetches every photo over the network before embedding it, so a big album (100+
// photos) needs real headroom — 60s was enough for a small test album but timed out for one.
export const maxDuration = 300;

export async function GET(request: NextRequest, { params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const { familyId, tier } = await requireSession();
  const id = Number(childId);

  const child = await getChild(id, familyId);
  if (!child) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from"); // "YYYY-MM-DD", inclusive
  const to = searchParams.get("to"); // "YYYY-MM-DD", inclusive

  const entries = await listJournalEntries(familyId, "child", tier);
  const photoEntries = entries
    .map((e) => ({ ...e, photos: e.photos.filter((p) => !p.excludeFromAlbum) }))
    .filter(
      (e) =>
        e.photos.length > 0 &&
        e.children.some((c) => c.id === id) &&
        (!from || e.entryDate >= from) &&
        (!to || e.entryDate <= to),
    );
  const pages = buildAlbumPages(sortAlbumEntries(photoEntries));
  const pdfPages = await preparePhotosForPdf(pages);

  const buffer = await renderToBuffer(<AlbumPdfDocument child={child} pages={pdfPages} />);

  const filename = `${child.name.replace(/[^a-z0-9]+/gi, "_")}-album.pdf`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
