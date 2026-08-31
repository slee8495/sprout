import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFamilyBilling, getFamilyStorageUsage } from "@/db/queries";
import { notifyStorageFull } from "@/lib/push";
import { formatBytes, getStorageQuota } from "@/lib/storage";
import { getPriceLabel } from "@/lib/stripe";

// Voice memos come through here rather than going straight to blob storage from the browser.
// The token flow in /api/audio/upload had the client PUT to *.public.blob.vercel-storage.com — a
// different origin — which is the same request shape that photos already keep a fallback for and
// that videos avoid entirely. Audio was the only one still relying on it, and in 186 saved entries
// not one voice memo had ever made it to the database: the token request succeeded, the
// cross-origin PUT didn't, and the throw took the whole journal entry down with it.
//
// A memo is a minute of audio at most, so there is nothing to gain from the direct upload anyway.
const ALLOWED_CONTENT_TYPES = new Set(["audio/webm", "audio/mp4", "audio/ogg", "audio/mpeg"]);

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.familyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const familyId = session.user.familyId;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  // Recorders report the container with codec parameters attached ("audio/mp4;codecs=mp4a.40.2"),
  // so compare on the container alone.
  const contentType = file.type.split(";")[0].trim();
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const [used, billing] = await Promise.all([getFamilyStorageUsage(familyId), getFamilyBilling(familyId)]);
  const quota = getStorageQuota(billing);
  if (used >= quota) {
    const addonPriceLabel = await getPriceLabel(process.env.STRIPE_STORAGE_ADDON_PRICE_ID);
    await notifyStorageFull(familyId, addonPriceLabel);
    return NextResponse.json(
      { error: `Storage limit reached (${formatBytes(used)} / ${formatBytes(quota)}). Delete some photos to free up space.` },
      { status: 400 },
    );
  }

  const blob = await put(file.name, file, { access: "public", addRandomSuffix: true, contentType });
  return NextResponse.json({ url: blob.url, sizeBytes: file.size });
}
