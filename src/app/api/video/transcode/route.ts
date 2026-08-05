import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import ffmpegPath from "ffmpeg-static";
import ffprobe from "ffprobe-static";
import { del, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const maxDuration = 180;

const MAX_DURATION_SECONDS = 60;
const execFileAsync = promisify(execFile);

async function probeDurationSeconds(filePath: string): Promise<number> {
  const { stdout } = await execFileAsync(ffprobe.path, [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "csv=p=0",
    filePath,
  ]);
  return Number(stdout.trim()) || 0;
}

async function transcode(inputPath: string, outputPath: string): Promise<void> {
  await execFileAsync(ffmpegPath as string, [
    "-y",
    "-i",
    inputPath,
    "-t",
    String(MAX_DURATION_SECONDS),
    "-vf",
    "scale='min(1280,iw)':'min(1280,ih)':force_original_aspect_ratio=decrease",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "28",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    outputPath,
  ]);
}

// Takes the URL of a raw video already uploaded to Blob (via /api/video/raw-upload) and
// transcodes it server-side. Split from the upload step because Vercel rejects inbound
// request bodies over ~4.5MB on this project — sending the raw file straight to a Function
// isn't viable for real video, so the client uploads directly to Blob first and only a
// small JSON URL crosses into this Function.
export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.familyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url: rawUrl } = (await request.json()) as { url?: string };
  if (!rawUrl || !rawUrl.includes(".public.blob.vercel-storage.com/")) {
    return NextResponse.json({ error: "Invalid video URL." }, { status: 400 });
  }

  const id = randomUUID();
  const inputPath = path.join(os.tmpdir(), `${id}-input`);
  const outputPath = path.join(os.tmpdir(), `${id}-output.mp4`);

  try {
    const videoResponse = await fetch(rawUrl);
    if (!videoResponse.ok) throw new Error("Couldn't retrieve the uploaded video.");
    const buffer = Buffer.from(await videoResponse.arrayBuffer());
    await writeFile(inputPath, buffer);

    const duration = await probeDurationSeconds(inputPath);
    if (duration > MAX_DURATION_SECONDS + 2) {
      return NextResponse.json({ error: `Videos must be ${MAX_DURATION_SECONDS} seconds or shorter.` }, { status: 400 });
    }

    await transcode(inputPath, outputPath);
    const output = await readFile(outputPath);

    const blob = await put(`videos/${id}.mp4`, output, { access: "public", addRandomSuffix: false });

    await del(rawUrl).catch(() => {});

    return NextResponse.json({ url: blob.url, sizeBytes: output.length });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  } finally {
    await Promise.all([unlink(inputPath).catch(() => {}), unlink(outputPath).catch(() => {})]);
  }
}
