"use client";

import { upload } from "@vercel/blob/client";

export async function uploadVoiceMemo(blob: Blob, filename = "voice-memo.webm") {
  return upload(filename, blob, {
    access: "public",
    handleUploadUrl: "/api/audio/upload",
  });
}
