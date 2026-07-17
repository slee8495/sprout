"use client";

import { upload } from "@vercel/blob/client";

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
};

export async function uploadVoiceMemo(blob: Blob) {
  const extension = EXTENSION_BY_MIME_TYPE[blob.type] ?? "webm";
  return upload(`voice-memo.${extension}`, blob, {
    access: "public",
    contentType: blob.type || "audio/webm",
    handleUploadUrl: "/api/audio/upload",
  });
}
