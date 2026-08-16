import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/session";

// Photos/videos live on Vercel Blob and render via plain <img>/<video src> tags, which never
// force a "Save As" dialog — especially on mobile, where the only alternative is a fiddly
// long-press. This proxies the blob through our own origin so Content-Disposition can force a
// real download, and only ever fetches from our own blob store (never an arbitrary URL).
const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

export async function GET(request: NextRequest) {
  await requireSession();

  const url = request.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }
  if (!parsed.hostname.endsWith(BLOB_HOST_SUFFIX)) {
    return NextResponse.json({ error: "Unsupported host" }, { status: 400 });
  }

  const upstream = await fetch(parsed.toString());
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Couldn't fetch file" }, { status: 502 });
  }

  const filename = decodeURIComponent(parsed.pathname.split("/").pop() || "download").replace(/[^\w.\-]+/g, "_");

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "Content-Length": upstream.headers.get("content-length") ?? "",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
