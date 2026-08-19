"use client";

import type { ReactNode } from "react";
import { useEffect, useState, useTransition } from "react";
import { Capacitor } from "@capacitor/core";
import { saveToPhotos } from "@/lib/saveToPhotos";
import { useSettings } from "./SettingsProvider";

// In the native app, save straight to the device's Photos library — no browser download UI to
// get stuck on. On the web, fall back to the plain <a href> (proxied through /api/download so it
// actually triggers a save instead of just opening the file).
export function DownloadButton({
  url,
  kind,
  className,
  children,
}: {
  url: string;
  kind: "photo" | "video";
  className?: string;
  children: ReactNode;
}) {
  const { t } = useSettings();
  const [isPending, startTransition] = useTransition();
  // The web-only <a href> fallback doesn't work inside the native app's WebView (no visible
  // download destination — the exact problem the native save flow was built to fix), so a native
  // build that predates the Media plugin has no good way to download at all. Hide the button
  // rather than show one that just alerts "Couldn't save" — it reappears on its own once the
  // user's app updates to a build with the plugin, no follow-up cleanup needed here.
  const [hideOnOldNativeBuild, setHideOnOldNativeBuild] = useState(false);
  // The native save is silent otherwise — nothing in the UI ever confirmed it happened, so a
  // successful save could look indistinguishable from a tap that did nothing.
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setHideOnOldNativeBuild(Capacitor.isNativePlatform() && !Capacitor.isPluginAvailable("Media"));
  }, []);

  // On Android, a plain <a download> lands in the general Downloads folder — not the gallery, and
  // not somewhere Google Photos ever looks. The Web Share API's file-sharing target list includes
  // "Save to Photos"/gallery apps, so route through the OS share sheet there instead. iOS Safari's
  // file-sharing support is inconsistent enough that it isn't worth the same treatment — that
  // platform keeps the plain download.
  async function shareOnAndroidWeb(): Promise<"shared" | "cancelled" | "unsupported"> {
    try {
      const response = await fetch(`/api/download?url=${encodeURIComponent(url)}`);
      if (!response.ok) return "unsupported";
      const blob = await response.blob();
      const filename = url.split("/").pop()?.split("?")[0] || (kind === "video" ? "video.mp4" : "photo.jpg");
      const file = new File([blob], filename, {
        type: blob.type || (kind === "video" ? "video/mp4" : "image/jpeg"),
      });
      if (!navigator.canShare?.({ files: [file] })) return "unsupported";
      await navigator.share({ files: [file] });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
      return "unsupported";
    }
  }

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.stopPropagation(); // don't let a parent overlay (e.g. the photo lightbox) treat this as "close"
    if (Capacitor.isNativePlatform()) {
      e.preventDefault();
      startTransition(async () => {
        const ok = await saveToPhotos(url, kind);
        if (ok) {
          setJustSaved(true);
          setTimeout(() => setJustSaved(false), 2000);
        } else {
          alert(t("Couldn't save — try again."));
        }
      });
      return;
    }
    if (/Android/.test(navigator.userAgent)) {
      e.preventDefault();
      startTransition(async () => {
        const result = await shareOnAndroidWeb();
        if (result === "unsupported") window.location.href = `/api/download?url=${encodeURIComponent(url)}`;
      });
      return;
    }
    // iOS web / everything else: fall through to the plain <a href> download below.
  }

  if (hideOnOldNativeBuild) return null;

  return (
    <a
      href={`/api/download?url=${encodeURIComponent(url)}`}
      onClick={handleClick}
      aria-busy={isPending}
      className={className}
    >
      {justSaved ? `✓ ${t("Saved")}` : children}
    </a>
  );
}
