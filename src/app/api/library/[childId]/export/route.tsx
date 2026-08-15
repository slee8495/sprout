import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";
import { getChild, listJournalEntries } from "@/db/queries";
import { buildAlbumPages, sortAlbumEntries } from "@/lib/albumPages";
import { requireSession } from "@/lib/session";
import { AlbumPdfDocument } from "./AlbumPdfDocument";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest, { params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  const { familyId } = await requireSession();
  const id = Number(childId);

  const child = await getChild(id, familyId);
  if (!child) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const searchParams = request.nextUrl.searchParams;
  const orientation = searchParams.get("orientation") === "landscape" ? "landscape" : "portrait";
  const sortOrder = searchParams.get("sort") === "latest" ? "latest" : "oldest";

  const entries = await listJournalEntries(familyId, "child");
  const photoEntries = entries.filter((e) => e.photos.length > 0 && e.children.some((c) => c.id === id));
  const pages = buildAlbumPages(sortAlbumEntries(photoEntries, sortOrder));

  const buffer = await renderToBuffer(<AlbumPdfDocument child={child} pages={pages} orientation={orientation} />);

  const filename = `${child.name.replace(/[^a-z0-9]+/gi, "_")}-album.pdf`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
