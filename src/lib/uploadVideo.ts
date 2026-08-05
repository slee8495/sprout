"use client";

export const MAX_VIDEO_DURATION_SECONDS = 60;

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

export async function uploadJournalVideo(file: File): Promise<{ url: string; sizeBytes: number }> {
  const duration = await getVideoDuration(file);
  if (duration > MAX_VIDEO_DURATION_SECONDS + 1) {
    throw new Error(
      `Videos must be ${MAX_VIDEO_DURATION_SECONDS} seconds or shorter (this one is ${Math.round(duration)}s).`,
    );
  }

  const response = await fetch("/api/video/upload", {
    method: "POST",
    headers: { "Content-Type": file.type || "video/mp4" },
    body: file,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Couldn't upload that video." }));
    throw new Error(body.error ?? "Couldn't upload that video.");
  }

  return response.json();
}
