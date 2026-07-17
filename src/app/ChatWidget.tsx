"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { prefetchSpeech, speak } from "@/lib/speak";

function messageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join(" ")
    .trim();
}

const RECORDING_MIME_TYPES = ["audio/webm", "audio/mp4", "audio/ogg"];

function pickRecordingMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return RECORDING_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [loadingSpeakId, setLoadingSpeakId] = useState<string | null>(null);
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const handledReplyIds = useRef(new Set<string>());
  useEffect(() => {
    if (status !== "ready") return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant" || handledReplyIds.current.has(last.id)) return;
    const text = messageText(last);
    if (!text) return;
    handledReplyIds.current.add(last.id);
    if (autoSpeak) {
      speak(text);
    } else {
      prefetchSpeech(text);
    }
  }, [autoSpeak, status, messages]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickRecordingMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
        setTranscribing(true);
        try {
          const form = new FormData();
          form.append("audio", blob, "voice-input.webm");
          const res = await fetch("/api/transcribe", { method: "POST", body: form });
          if (!res.ok) throw new Error("transcription failed");
          const { text } = await res.json();
          if (text?.trim()) sendMessage({ text: text.trim() });
        } catch {
          // best-effort — silently drop, user can just type instead
        } finally {
          setTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      // mic permission denied or unsupported — no-op, user can still type
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
  }

  return (
    <>
      {open && (
        <div
          className="fixed bottom-20 right-4 z-20 flex h-[70vh] max-h-[560px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-xl shadow-emerald-900/10 dark:border-emerald-900 dark:bg-zinc-950 print:hidden"
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-center justify-between border-b border-emerald-100 px-4 py-3 dark:border-emerald-900">
            <span className="font-heading text-sm font-bold text-emerald-800 dark:text-emerald-200">
              🌱 Ask about Roun
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoSpeak((v) => !v)}
                aria-pressed={autoSpeak}
                aria-label="Read replies aloud"
                title="Read replies aloud"
                className={`text-base ${autoSpeak ? "" : "opacity-40"}`}
              >
                {autoSpeak ? "🔊" : "🔇"}
              </button>
              <button onClick={() => setOpen(false)} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Ask things like &quot;when did Roun first eat solid food?&quot; or &quot;처음 걸은 날이 언제야?&quot;
              </p>
            )}
            <div className="flex flex-col gap-3">
              {messages.map((message) => (
                <div key={message.id} className={message.role === "user" ? "text-right" : "text-left"}>
                  <div
                    className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      message.role === "user"
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-50 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    {message.parts.map((part, i) =>
                      part.type === "text" ? <span key={i}>{part.text}</span> : null,
                    )}
                  </div>
                  {message.role === "assistant" && messageText(message) && (
                    <button
                      onClick={async () => {
                        setLoadingSpeakId(message.id);
                        await speak(messageText(message));
                        setLoadingSpeakId((id) => (id === message.id ? null : id));
                      }}
                      disabled={loadingSpeakId === message.id}
                      aria-label="Read this reply aloud"
                      title="Read aloud"
                      className="ml-1 align-middle text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-50"
                    >
                      {loadingSpeakId === message.id ? "…" : "🔊"}
                    </button>
                  )}
                </div>
              ))}
              {status === "submitted" && <div className="text-sm text-zinc-500 dark:text-zinc-400">Thinking…</div>}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!input.trim()) return;
              sendMessage({ text: input });
              setInput("");
            }}
            className="flex gap-2 border-t border-emerald-100 p-3 dark:border-emerald-900"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={status !== "ready"}
              placeholder={recording ? "Listening…" : transcribing ? "Transcribing…" : "Ask a question…"}
              className="min-w-0 flex-1 rounded-full border border-emerald-100 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-emerald-400 dark:border-emerald-900/40"
            />
            <button
              type="button"
              onClick={() => (recording ? stopRecording() : startRecording())}
              disabled={status !== "ready" || transcribing}
              aria-pressed={recording}
              aria-label={recording ? "Stop recording" : "Ask by voice"}
              title={recording ? "Stop recording" : "Ask by voice"}
              className={`rounded-full px-3 py-1.5 text-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 ${
                recording
                  ? "bg-rose-500 text-white"
                  : "border border-emerald-100 text-emerald-800 dark:border-emerald-900/40 dark:text-emerald-200"
              }`}
            >
              {recording ? "⏹" : "🎤"}
            </button>
            <button
              type="submit"
              disabled={status !== "ready"}
              className="rounded-full bg-emerald-600 px-4 py-1.5 font-heading text-sm font-semibold text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-4 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-2xl text-white shadow-lg shadow-emerald-900/25 transition-transform hover:scale-110 active:scale-95 print:hidden"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Chat"
      >
        {open ? "✕" : "🌱"}
      </button>
    </>
  );
}
