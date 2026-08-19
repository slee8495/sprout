"use client";

import { upload } from "@vercel/blob/client";

const MAX_DIMENSION = 2000;

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Failed to encode image"))), type, quality);
  });
}

async function encodeResized(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
): Promise<{ blob: Blob; extension: string }> {
  const scale = Math.min(1, MAX_DIMENSION / Math.max(sourceWidth, sourceHeight));
  const width = Math.round(sourceWidth * scale);
  const height = Math.round(sourceHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(source, 0, 0, width, height);

  // Safari's canvas WebP *encoder* support is unreliable even though it can display WebP —
  // toBlob() silently falls back to lossless PNG (many times the size) when the requested
  // type isn't actually supported. Detect that fallback and re-encode as JPEG instead, which
  // every browser supports and which compresses photos far better than PNG ever would.
  const webp = await canvasToBlob(canvas, "image/webp", 0.85);
  if (webp.type === "image/webp") return { blob: webp, extension: "webp" };

  const jpeg = await canvasToBlob(canvas, "image/jpeg", 0.85);
  return { blob: jpeg, extension: "jpg" };
}

async function resizeViaImageBitmap(file: File) {
  const bitmap = await createImageBitmap(file);
  try {
    return await encodeResized(bitmap, bitmap.width, bitmap.height);
  } finally {
    bitmap.close();
  }
}

// createImageBitmap has known gaps on some older Android WebViews and in-app browsers (KakaoTalk's
// among them). A plain <img> element decodes through a completely different code path and often
// succeeds in exactly the cases where createImageBitmap doesn't.
async function resizeViaImageElement(file: File) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Failed to decode image"));
      el.src = objectUrl;
    });
    return await encodeResized(img, img.naturalWidth, img.naturalHeight);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

// Must match the server's allowedContentTypes in api/photos/upload — the original-file fallback
// below is only safe to take for a type the upload route will actually accept.
const UPLOADABLE_TYPES = new Set(["image/webp", "image/avif", "image/jpeg", "image/png"]);

// Stay safely under the ~4.5MB inbound request body limit noted in api/video/transcode/route.ts —
// resized photos are normally well under this, so it's only the raw-original fallback above that
// could ever get close.
const SERVER_PROXY_MAX_BYTES = 4 * 1024 * 1024;

// Fallback used when the normal direct-to-blob-storage upload below fails — that upload crosses
// to a different origin (*.public.blob.vercel-storage.com) from a client fetch, which an old
// Android WebView was seen mangling (on wifi, so not a carrier issue) even though the identical
// upload succeeded from a regular mobile browser on the same device/network. Routing through our
// own same-origin server instead sidesteps whatever broke that direct cross-origin request.
async function uploadViaServerProxy(filename: string, blob: Blob): Promise<{ url: string; sizeBytes: number }> {
  const formData = new FormData();
  formData.append("file", blob, filename);
  const response = await fetch("/api/photos/upload-direct", { method: "POST", body: formData });
  if (!response.ok) {
    const { error } = await response.json().catch(() => ({ error: undefined }));
    throw new Error(error || "Couldn't upload the photo.");
  }
  return response.json();
}

export async function uploadJournalPhoto(file: File) {
  let blob: Blob;
  let extension: string;
  try {
    ({ blob, extension } = await resizeViaImageBitmap(file));
  } catch {
    try {
      ({ blob, extension } = await resizeViaImageElement(file));
    } catch {
      // Both decode paths failed — rare, but some older Android WebViews/in-app browsers support
      // neither reliably. Upload the original untouched rather than failing the entry outright,
      // and only for a type the server already accepts (otherwise a clear error beats a silently
      // oversized or rejected upload).
      if (!UPLOADABLE_TYPES.has(file.type)) throw new Error("Couldn't process this image — try a different photo.");
      blob = file;
      extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    }
  }

  const filename = file.name.replace(/\.[^.]+$/, "") + "." + extension;

  try {
    const result = await upload(filename, blob, {
      access: "public",
      handleUploadUrl: "/api/photos/upload",
    });
    return { ...result, sizeBytes: blob.size };
  } catch (err) {
    if (blob.size > SERVER_PROXY_MAX_BYTES) throw err;
    return await uploadViaServerProxy(filename, blob);
  }
}
