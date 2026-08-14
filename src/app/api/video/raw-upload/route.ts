import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFamilyBilling, getFamilyStorageUsage } from "@/db/queries";
import { notifyStorageFull } from "@/lib/push";
import { formatBytes, getStorageQuota } from "@/lib/storage";
import { getPriceLabel } from "@/lib/stripe";

// Client uploads the raw video straight to Blob (bypassing this Function's request body
// entirely) — Vercel's ~4.5MB inbound body limit on this project made a direct POST of the
// raw file to a Function unworkable for any real video. /api/video/transcode picks up from
// the resulting blob URL to run ffmpeg.
export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.familyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const familyId = session.user.familyId;

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const [used, billing] = await Promise.all([getFamilyStorageUsage(familyId), getFamilyBilling(familyId)]);
        const quota = getStorageQuota(billing);
        if (used >= quota) {
          const addonPriceLabel = await getPriceLabel(process.env.STRIPE_STORAGE_ADDON_PRICE_ID);
          await notifyStorageFull(familyId, addonPriceLabel);
          throw new Error(
            `Storage limit reached (${formatBytes(used)} / ${formatBytes(quota)}). Delete some photos to free up space.`,
          );
        }
        return {
          allowedContentTypes: ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"],
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
