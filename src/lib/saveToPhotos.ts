"use client";

import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { Media } from "@capacitor-community/media";

const ALBUM_NAME = "Roun";
const ALBUM_ID_KEY = "mediaAlbumId";

// Android requires an album identifier on every save; iOS doesn't. Create the album once and
// cache its id locally so this is a no-op after the first save on a device.
async function getAndroidAlbumId(): Promise<string | undefined> {
  if (Capacitor.getPlatform() !== "android") return undefined;

  const { value: cached } = await Preferences.get({ key: ALBUM_ID_KEY });
  if (cached) return cached;

  const { albums } = await Media.getAlbums();
  let album = albums.find((a) => a.name === ALBUM_NAME);
  if (!album) {
    await Media.createAlbum({ name: ALBUM_NAME });
    album = (await Media.getAlbums()).albums.find((a) => a.name === ALBUM_NAME);
  }
  if (album) await Preferences.set({ key: ALBUM_ID_KEY, value: album.identifier });
  return album?.identifier;
}

// Saves a photo/video straight to the device's Photos library — native only. Callers should fall
// back to the web download flow (a plain link) when this returns false or isn't attempted.
export async function saveToPhotos(url: string, kind: "photo" | "video"): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable("Media")) return false;

  try {
    const albumIdentifier = await getAndroidAlbumId();
    if (kind === "photo") {
      await Media.savePhoto({ path: url, albumIdentifier });
    } else {
      await Media.saveVideo({ path: url, albumIdentifier });
    }
    return true;
  } catch {
    return false;
  }
}
