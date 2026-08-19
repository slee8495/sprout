import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFamilyBilling, getFamilyStorageUsage } from "@/db/queries";
import { notifyStorageFull } from "@/lib/push";
import { formatBytes, getStorageQuota } from "@/lib/storage";
import { getPriceLabel } from "@/lib/stripe";

// Fallback for when the client's direct-to-blob-storage upload (src/lib/uploadPhoto.ts) fails.
// That normal path has the browser PUT straight to *.public.blob.vercel-storage.com, a different
// origin from our own — seen failing on an old Android WebView (on wifi, so not a carrier issue)
// with @vercel/blob's generic "Unknown error", which it throws when that cross-origin response
// isn't parseable JSON. Routing the (already-resized, small) photo through our own same-origin
// server instead sidesteps whatever mangled the direct cross-origin request — same idea as
// /api/download proxying blob reads through our own origin for the reverse direction.
const ALLOWED_CONTENT_TYPES = new Set(["image/webp", "image/avif", "image/jpeg", "image/png"]);

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
  if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
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

  const blob = await put(file.name, file, { access: "public", addRandomSuffix: true });
  return NextResponse.json({ url: blob.url, sizeBytes: file.size });
}
