"use client";

import { upload } from "@vercel/blob/client";

export const MAX_VIDEO_DURATION_SECONDS = 60;
const MAX_VIDEO_FILE_SIZE_BYTES = 500 * 1024 * 1024;

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/x-m4v": "m4v",
};

export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Couldn't read that video file."));
    };
    video.src = URL.createObjectURL(file);
  });
}

// Two-phase upload: the raw file goes straight to Blob (client-direct, like photos/audio),
// then a small JSON request asks the server to fetch it back and transcode it. Vercel
// rejects inbound Function request bodies over ~4.5MB on this project, so posting the raw
// video straight to a Function — as this used to do — silently failed for any real video.
export async function uploadJournalVideo(file: File): Promise<{ url: string; sizeBytes: number }> {
  const duration = await getVideoDuration(file);
  if (duration > MAX_VIDEO_DURATION_SECONDS + 1) {
    throw new Error(
      `Videos must be ${MAX_VIDEO_DURATION_SECONDS} seconds or shorter (this one is ${Math.round(duration)}s).`,
    );
  }
  if (file.size > MAX_VIDEO_FILE_SIZE_BYTES) {
    throw new Error(`That video file is too large (max ${MAX_VIDEO_FILE_SIZE_BYTES / (1024 * 1024)}MB).`);
  }

  const extension = EXTENSION_BY_MIME_TYPE[file.type] ?? "mp4";
  const raw = await upload(`raw.${extension}`, file, {
    access: "public",
    contentType: file.type || "video/mp4",
    handleUploadUrl: "/api/video/raw-upload",
  });

  const response = await fetch("/api/video/transcode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: raw.url }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Couldn't process that video." }));
    throw new Error(body.error ?? "Couldn't process that video.");
  }

  return response.json();
}
