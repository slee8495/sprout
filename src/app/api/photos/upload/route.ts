import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFamilyBilling, getFamilyStorageUsage } from "@/db/queries";
import { notifyStorageFull } from "@/lib/push";
import { formatBytes, getStorageQuota } from "@/lib/storage";
import { getPriceLabel } from "@/lib/stripe";

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
          allowedContentTypes: ["image/webp", "image/avif", "image/jpeg", "image/png"],
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // The client links the resulting blob URL to a journal entry via the entries API
        // after upload completes, so nothing to do here.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
