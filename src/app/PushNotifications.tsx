"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState, useSyncExternalStore } from "react";
import { isPushSupported, subscribeToPushNotifications } from "@/lib/webPush";

function getPermissionSnapshot(): NotificationPermission | "unsupported" {
  return isPushSupported() ? Notification.permission : "unsupported";
}

function getServerPermissionSnapshot(): NotificationPermission | "unsupported" {
  return "unsupported";
}

function subscribeToNothing() {
  return () => {};
}

// First-run floating prompt. See settings/NotificationsCard.tsx for turning notifications back
// off (or on again after a Settings-driven opt-out) once they've been granted once.
export function PushNotifications() {
  const permission = useSyncExternalStore(subscribeToNothing, getPermissionSnapshot, getServerPermissionSnapshot);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (permission === "granted") {
      subscribeToPushNotifications().catch((err) => Sentry.captureException(err));
    }
  }, [permission]);

  async function handleEnable() {
    setPending(true);
    setError(false);
    try {
      const result = await Notification.requestPermission();
      if (result === "granted") await subscribeToPushNotifications();
    } catch (err) {
      Sentry.captureException(err);
      setError(true);
    } finally {
      setPending(false);
    }
  }

  if (permission !== "default") return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1 print:hidden">
      <button
        onClick={handleEnable}
        disabled={pending}
        className="rounded-full bg-brand-600 px-4 py-2 font-heading text-sm font-semibold text-white shadow-lg shadow-brand-900/30 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
      >
        {pending ? "Enabling…" : "🔔 Enable notifications"}
      </button>
      {error && <p className="text-xs font-semibold text-rose-600">Couldn&apos;t enable notifications — try again.</p>}
    </div>
  );
}
