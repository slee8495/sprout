"use client";

import { upload } from "@vercel/blob/client";

const MAX_DIMENSION = 2000;

async function resizeToWebp(file: File): Promise<Blob> {
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

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to encode image"))),
      "image/webp",
      0.85,
    );
  });
}

export async function uploadJournalPhoto(file: File) {
  const optimized = await resizeToWebp(file);
  const filename = file.name.replace(/\.[^.]+$/, "") + ".webp";

  return upload(filename, optimized, {
    access: "public",
    handleUploadUrl: "/api/photos/upload",
  });
}
