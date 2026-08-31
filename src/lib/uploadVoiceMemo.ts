"use client";

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
};

/**
 * Sends the memo through our own origin rather than the client-token flow that PUTs straight to
 * *.public.blob.vercel-storage.com. That cross-origin PUT is the one photos keep a fallback for
 * and videos skip altogether, and it was failing here every time — the token came back fine, the
 * upload didn't, and because the save runs in one try block the journal entry went down with it.
 * That is why no entry in the app had ever carried a voice memo.
 *
 * A memo is a minute of audio at most, so routing it through the server costs nothing.
 */
export async function uploadVoiceMemo(blob: Blob) {
  // A recorder names its container with the codecs attached — "audio/mp4;codecs=mp4a.40.2" — which
  // is true of the blob but isn't what the extension table or the route's allow-list is keyed on.
  const mimeType = blob.type.split(";")[0].trim() || "audio/webm";
  const extension = EXTENSION_BY_MIME_TYPE[mimeType] ?? "webm";

  const formData = new FormData();
  formData.append("file", new File([blob], `voice-memo.${extension}`, { type: mimeType }));

  const response = await fetch("/api/audio/upload-direct", { method: "POST", body: formData });
  if (!response.ok) {
    const { error } = await response.json().catch(() => ({ error: undefined }));
    throw new Error(error || "Couldn't upload the voice memo.");
  }
  return response.json() as Promise<{ url: string; sizeBytes: number }>;
}
