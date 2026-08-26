"use client";

// When a photo or video is picked, the entry form has no idea when it was taken — which is fine for
// today's shots and useless for a throwback, where the whole point is to file the entry under the
// day it actually happened. This reads the capture date out of the file so the form can show it and
// offer it as the entry date.
//
// Photos and videos keep that date in completely different places: photos in EXIF, videos in the
// QuickTime/MP4 box tree. Both fall back to `File.lastModified`, but only when it isn't
// suspiciously close to now — an export or download timestamp looks exactly like that.

const EXIF_SCAN_BYTES = 256 * 1024; // EXIF lives near the start; no reason to read a whole photo
const RECENT_MS = 24 * 60 * 60 * 1000;

/** The day the photo was taken, as `YYYY-MM-DD`, or null if the file doesn't say. */
export async function readPhotoDate(file: File): Promise<string | null> {
  const fromExif = await readExifDate(file).catch(() => null);
  if (fromExif) return fromExif;

  return fallbackToFileDate(file);
}

function toIsoDay(date: Date): string | null {
  if (Number.isNaN(date.getTime())) return null;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** The day the video was recorded, as `YYYY-MM-DD`, or null if the file doesn't say. */
export async function readVideoDate(file: File): Promise<string | null> {
  const fromContainer = await readQuickTimeDate(file).catch(() => null);
  if (fromContainer) return fromContainer;
  return fallbackToFileDate(file);
}

/** Shared fallback: a modification time only means something if it isn't essentially now. */
function fallbackToFileDate(file: File): string | null {
  if (file.lastModified && Date.now() - file.lastModified > RECENT_MS) {
    return toIsoDay(new Date(file.lastModified));
  }
  return null;
}

// --- QuickTime / MP4 ----------------------------------------------------------------------------
// Both formats are trees of boxes: a 4-byte size, a 4-byte type, then the payload. The recording
// time sits in `mvhd` inside `moov`. Only box headers are read here — `moov` can be at the very end
// of a file that wasn't written for streaming, and pulling a whole video into memory to find it
// would be wasteful on a phone.

/** QuickTime counts seconds from 1904-01-01 UTC rather than the Unix epoch. */
const QUICKTIME_EPOCH_OFFSET_MS = 2_082_844_800_000;

async function readQuickTimeDate(file: File): Promise<string | null> {
  const moov = await findBox(file, 0, file.size, "moov");
  if (!moov) return null;

  // Apple records the real capture date in its own metadata key, separate from the container's own
  // clock. That matters because iOS re-encodes a video on its way through a file input, and the
  // re-encode stamps `mvhd` with the moment of the export — so on iPhone the container clock says
  // "now" for a clip shot years ago. Ask Apple's key first, and treat `mvhd` as a fallback that
  // can't be believed when it points at roughly now.
  const fromApple = await readAppleCreationDate(file, moov);
  if (fromApple) return fromApple;

  const mvhd = await findBox(file, moov.start, moov.end, "mvhd");
  if (!mvhd) return null;

  // mvhd payload: 1-byte version, 3-byte flags, then creation time — 32-bit in version 0, 64-bit
  // in version 1.
  const header = new DataView(await file.slice(mvhd.start, mvhd.start + 20).arrayBuffer());
  if (header.byteLength < 12) return null;

  const version = header.getUint8(0);
  const seconds = version === 1 ? Number(header.getBigUint64(4)) : header.getUint32(4);
  if (!seconds) return null; // cameras with no clock set write zero

  const recorded = new Date(seconds * 1000 - QUICKTIME_EPOCH_OFFSET_MS);
  if (Date.now() - recorded.getTime() < RECENT_MS) return null; // an export stamp, not a capture
  return toIsoDay(recorded);
}

const APPLE_CREATION_KEY = "com.apple.quicktime.creationdate";

/**
 * `moov/meta` holds a `keys` list naming each piece of metadata and an `ilst` holding the values,
 * matched by position. Walks the names to find Apple's capture date, then reads the value sitting
 * at the same index.
 */
async function readAppleCreationDate(file: File, moov: Box): Promise<string | null> {
  // Cameras write `meta` straight into `moov`; re-encoders tend to tuck it inside `udta` instead.
  const udta = await findBox(file, moov.start, moov.end, "udta");
  const meta =
    (await findBox(file, moov.start, moov.end, "meta")) ??
    (udta ? await findBox(file, udta.start, udta.end, "meta") : null);
  if (!meta) return null;

  // `meta` carries a version/flags word in MP4 but not in QuickTime, so its children start at one
  // of two places — try the plain layout, then the offset one.
  for (const childrenStart of [meta.start, meta.start + 4]) {
    const keys = await findBox(file, childrenStart, meta.end, "keys");
    const ilst = await findBox(file, childrenStart, meta.end, "ilst");
    if (!keys || !ilst) continue;

    const index = await findKeyIndex(file, keys);
    if (index === null) continue;

    const value = await readIlstString(file, ilst, index);
    const parsed = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (parsed) return `${parsed[1]}-${parsed[2]}-${parsed[3]}`;
  }
  return null;
}

/** 1-based position of Apple's capture-date key within the `keys` box, or null. */
async function findKeyIndex(file: File, keys: Box): Promise<number | null> {
  const buffer = await file.slice(keys.start, Math.min(keys.end, keys.start + 4096)).arrayBuffer();
  const view = new DataView(buffer);
  if (view.byteLength < 8) return null;

  const count = view.getUint32(4); // after the version/flags word
  let offset = 8;

  for (let i = 1; i <= count; i++) {
    if (offset + 8 > view.byteLength) return null;
    const size = view.getUint32(offset);
    if (size < 8 || offset + size > view.byteLength) return null;

    let name = "";
    for (let j = offset + 8; j < offset + size; j++) name += String.fromCharCode(view.getUint8(j));
    if (name === APPLE_CREATION_KEY) return i;

    offset += size;
  }
  return null;
}

/** The string value stored at `index` in an `ilst` box. */
async function readIlstString(file: File, ilst: Box, index: number): Promise<string | null> {
  const buffer = await file.slice(ilst.start, Math.min(ilst.end, ilst.start + 8192)).arrayBuffer();
  const view = new DataView(buffer);
  let offset = 0;

  while (offset + 8 <= view.byteLength) {
    const size = view.getUint32(offset);
    if (size < 8 || offset + size > view.byteLength) return null;

    if (view.getUint32(offset + 4) === index) {
      // Inside the item sits a `data` box: size, "data", 4-byte type, 4-byte locale, then the value.
      const dataStart = offset + 8;
      if (dataStart + 16 > view.byteLength) return null;
      const dataSize = view.getUint32(dataStart);
      const valueStart = dataStart + 16;
      const valueEnd = Math.min(dataStart + dataSize, view.byteLength);
      if (valueEnd <= valueStart) return null;

      return new TextDecoder().decode(buffer.slice(valueStart, valueEnd));
    }
    offset += size;
  }
  return null;
}

type Box = { start: number; end: number };

/** Walks the boxes between `from` and `to`, returning the payload bounds of the first match. */
async function findBox(file: File, from: number, to: number, wanted: string): Promise<Box | null> {
  let offset = from;

  while (offset + 8 <= to) {
    const header = new DataView(await file.slice(offset, offset + 16).arrayBuffer());
    if (header.byteLength < 8) return null;

    let size = header.getUint32(0);
    let headerLength = 8;
    if (size === 1) {
      // Size 1 means the real 64-bit size follows the type — used by boxes larger than 4GB.
      if (header.byteLength < 16) return null;
      size = Number(header.getBigUint64(8));
      headerLength = 16;
    } else if (size === 0) {
      size = to - offset; // size 0 means "runs to the end of the file"
    }
    if (size < headerLength) return null; // malformed; stop rather than loop forever

    const type = String.fromCharCode(header.getUint8(4), header.getUint8(5), header.getUint8(6), header.getUint8(7));
    if (type === wanted) return { start: offset + headerLength, end: offset + size };

    offset += size;
  }
  return null;
}

// --- EXIF ---------------------------------------------------------------------------------------
// Only the capture date is wanted, so this walks straight to it rather than pulling in a parser
// library: JPEG markers -> the APP1 "Exif" segment -> TIFF header -> IFD0 -> the Exif sub-IFD.
// Anything unexpected returns null; a photo whose date can't be read is a normal outcome here, not
// an error. HEIC files (Android and desktop can hand those over; iOS Safari converts to JPEG on
// upload) store EXIF elsewhere and fall through to the lastModified path above.

const TAG_EXIF_IFD_POINTER = 0x8769;
const TAG_DATE_TIME_ORIGINAL = 0x9003;
const TAG_DATE_TIME_DIGITIZED = 0x9004;
const TAG_DATE_TIME = 0x0132;

async function readExifDate(file: File): Promise<string | null> {
  const buffer = await file.slice(0, EXIF_SCAN_BYTES).arrayBuffer();
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null; // not a JPEG

  const tiffStart = findExifSegment(view);
  if (tiffStart === null) return null;

  const little = view.getUint16(tiffStart) === 0x4949;
  if (!little && view.getUint16(tiffStart) !== 0x4d4d) return null;
  if (view.getUint16(tiffStart + 2, little) !== 0x002a) return null;

  const ifd0 = tiffStart + view.getUint32(tiffStart + 4, little);
  const exifIfd = readPointerTag(view, tiffStart, ifd0, little, TAG_EXIF_IFD_POINTER);

  for (const [ifd, tag] of [
    [exifIfd, TAG_DATE_TIME_ORIGINAL],
    [exifIfd, TAG_DATE_TIME_DIGITIZED],
    [ifd0, TAG_DATE_TIME],
  ] as const) {
    if (ifd === null) continue;
    const raw = readStringTag(view, tiffStart, ifd, little, tag);
    const parsed = raw === null ? null : parseExifDateTime(raw);
    if (parsed) return parsed;
  }
  return null;
}

/** Byte offset of the TIFF header inside the APP1 segment, or null if there isn't one. */
function findExifSegment(view: DataView): number | null {
  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    if (view.getUint8(offset) !== 0xff) return null; // out of sync with the marker stream
    const marker = view.getUint8(offset + 1);
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2; // standalone markers carry no payload
      continue;
    }
    if (marker === 0xda) return null; // start of scan: past every metadata segment
    const length = view.getUint16(offset + 2);
    if (length < 2) return null;
    if (marker === 0xe1 && offset + 10 <= view.byteLength && view.getUint32(offset + 4) === 0x45786966) {
      return offset + 10; // skip "Exif\0\0"
    }
    offset += 2 + length;
  }
  return null;
}

/** Walks an IFD's entries and hands each one to `read` until it returns something. */
function findEntry<T>(
  view: DataView,
  ifdOffset: number,
  little: boolean,
  wantedTag: number,
  read: (entry: number) => T | null,
): T | null {
  if (ifdOffset + 2 > view.byteLength) return null;
  const count = view.getUint16(ifdOffset, little);

  for (let i = 0; i < count; i++) {
    const entry = ifdOffset + 2 + i * 12;
    if (entry + 12 > view.byteLength) return null;
    if (view.getUint16(entry, little) === wantedTag) return read(entry);
  }
  return null;
}

/** Offset of a sub-IFD, relative to the TIFF header. */
function readPointerTag(
  view: DataView,
  tiffStart: number,
  ifdOffset: number,
  little: boolean,
  wantedTag: number,
): number | null {
  return findEntry(view, ifdOffset, little, wantedTag, (entry) => tiffStart + view.getUint32(entry + 8, little));
}

/** ASCII value of a tag. */
function readStringTag(
  view: DataView,
  tiffStart: number,
  ifdOffset: number,
  little: boolean,
  wantedTag: number,
): string | null {
  return findEntry(view, ifdOffset, little, wantedTag, (entry) => {
    const length = view.getUint32(entry + 4, little);
    // Values of 4 bytes or fewer sit inline; longer ones are stored elsewhere and pointed at.
    const valueAt = length <= 4 ? entry + 8 : tiffStart + view.getUint32(entry + 8, little);
    if (valueAt + length > view.byteLength) return null;

    let text = "";
    for (let j = 0; j < length; j++) {
      const code = view.getUint8(valueAt + j);
      if (code === 0) break; // NUL-terminated
      text += String.fromCharCode(code);
    }
    return text;
  });
}

/** EXIF writes "YYYY:MM:DD HH:MM:SS", and blanks or zeroes it when the camera had no clock. */
function parseExifDateTime(value: string): string | null {
  const match = /^(\d{4}):(\d{2}):(\d{2})/.exec(value.trim());
  if (!match) return null;
  const [, year, month, day] = match;
  if (year === "0000" || month === "00" || day === "00") return null;
  return `${year}-${month}-${day}`;
}
