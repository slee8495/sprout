"use client";

// When a photo is picked, the entry form has no idea when it was taken — which is fine for today's
// photos and useless for a throwback, where the whole point is to file the entry under the day it
// actually happened. This reads the capture date out of the file so the form can show it and offer
// it as the entry date.
//
// EXIF is the only trustworthy source: `File.lastModified` is often the moment the photo was
// exported or copied rather than shot. It's still used as a fallback, but only when it isn't
// suspiciously close to now, which is what an export timestamp looks like.

const EXIF_SCAN_BYTES = 256 * 1024; // EXIF lives near the start; no reason to read a whole photo
const RECENT_MS = 24 * 60 * 60 * 1000;

/** The day the photo was taken, as `YYYY-MM-DD`, or null if the file doesn't say. */
export async function readPhotoDate(file: File): Promise<string | null> {
  const fromExif = await readExifDate(file).catch(() => null);
  if (fromExif) return fromExif;

  // An export or download timestamp is almost always "just now"; a genuine one rarely is.
  if (file.lastModified && Date.now() - file.lastModified > RECENT_MS) {
    return toIsoDay(new Date(file.lastModified));
  }
  return null;
}

function toIsoDay(date: Date): string | null {
  if (Number.isNaN(date.getTime())) return null;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
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
