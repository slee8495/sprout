"use client";

import { upload } from "@vercel/blob/client";

const MAX_DIMENSION = 2000;

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Failed to encode image"))), type, quality);
  });
}

async function resizePhoto(file: File): Promise<{ blob: Blob; extension: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, width, height);

  // Safari's canvas WebP *encoder* support is unreliable even though it can display WebP —
  // toBlob() silently falls back to lossless PNG (many times the size) when the requested
  // type isn't actually supported. Detect that fallback and re-encode as JPEG instead, which
  // every browser supports and which compresses photos far better than PNG ever would.
  const webp = await canvasToBlob(canvas, "image/webp", 0.85);
  if (webp.type === "image/webp") return { blob: webp, extension: "webp" };

  const jpeg = await canvasToBlob(canvas, "image/jpeg", 0.85);
  return { blob: jpeg, extension: "jpg" };
}

export async function uploadJournalPhoto(file: File) {
  const { blob, extension } = await resizePhoto(file);
  const filename = file.name.replace(/\.[^.]+$/, "") + "." + extension;

  const result = await upload(filename, blob, {
    access: "public",
    handleUploadUrl: "/api/photos/upload",
  });

  return { ...result, sizeBytes: blob.size };
}
