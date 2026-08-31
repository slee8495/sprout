"use client";

import { upload } from "@vercel/blob/client";

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
};

export async function uploadVoiceMemo(blob: Blob) {
  // A recorder names its container with the codecs attached — "audio/mp4;codecs=mp4a.40.2" — which
  // is true of the blob but matches neither the extension table below nor the upload route's
  // allow-list, and an unlisted content type is rejected there with a 400. Since the whole save
  // runs in one try block, that took the journal entry down with it: nothing saved at all.
  const mimeType = blob.type.split(";")[0].trim() || "audio/webm";
  const extension = EXTENSION_BY_MIME_TYPE[mimeType] ?? "webm";
  return upload(`voice-memo.${extension}`, blob, {
    access: "public",
    contentType: mimeType,
    handleUploadUrl: "/api/audio/upload",
  });
}
