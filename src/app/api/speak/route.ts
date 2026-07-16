import { NextRequest, NextResponse } from "next/server";
import { gateway, generateSpeech } from "ai";
import { auth } from "@/auth";
import { SPEECH_MODEL_ID } from "@/lib/ai/model";

export const maxDuration = 60;

// Neural TTS for reading chatbot replies aloud, routed through AI Gateway (openai/tts-1).
// The client falls back to the browser's Web Speech API if this request fails.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const text = (req.nextUrl.searchParams.get("text") ?? "").trim().slice(0, 2000);
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  try {
    const { audio } = await generateSpeech({
      model: gateway.speech(SPEECH_MODEL_ID),
      text,
      voice: "nova",
      outputFormat: "mp3",
    });

    return new NextResponse(Buffer.from(audio.uint8Array), {
      headers: {
        "Content-Type": audio.mediaType || "audio/mpeg",
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "tts failed", detail: message }, { status: 500 });
  }
}
