"use client";

import type { ReactNode } from "react";
import { useTransition } from "react";
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

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.stopPropagation(); // don't let a parent overlay (e.g. the photo lightbox) treat this as "close"
    if (!Capacitor.isNativePlatform()) return;
    e.preventDefault();
    startTransition(async () => {
      const ok = await saveToPhotos(url, kind);
      if (!ok) alert(t("Couldn't save — try again."));
    });
  }

  return (
    <a
      href={`/api/download?url=${encodeURIComponent(url)}`}
      onClick={handleClick}
      aria-busy={isPending}
      className={className}
    >
      {children}
    </a>
  );
}
