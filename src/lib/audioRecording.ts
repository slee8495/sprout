// Voice memos are recorded in three places (the entry form, editing an entry, and the chat
// widget). They used to each carry their own copy of this, which is how the wrong container got
// picked in all three at once.

// MP4 first, deliberately. Safari and the iOS WebView will happily *record* WebM, but playback
// there goes through AVFoundation, which has no WebM decoder — so a memo recorded on an iPhone
// came back as a play button that did nothing. Chrome reports no MP4 recording support and falls
// through to WebM, which it can play, so asking for MP4 first costs nothing and each platform
// ends up with a container it can also read back.
const RECORDING_MIME_TYPES = ["audio/mp4", "audio/webm", "audio/ogg"];

/** The best container this browser can record, or undefined to let it choose for itself. */
export function pickRecordingMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return RECORDING_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

/**
 * Wraps recorded chunks with the type the recorder actually used. Labelling the blob with our
 * requested type — or a hardcoded default when we hadn't requested one — could describe the bytes
 * wrongly, and a mislabelled blob is one an `<audio>` element refuses to play.
 */
export function recordedBlob(recorder: MediaRecorder, chunks: BlobPart[]): Blob {
  return new Blob(chunks, { type: recorder.mimeType || pickRecordingMimeType() || "audio/webm" });
}
