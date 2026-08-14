"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useSyncExternalStore } from "react";
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

// No visible ask — browsers still require a real user gesture to show the permission dialog, so
// this silently piggybacks on the user's first tap anywhere in the app instead of a dedicated
// "Enable notifications" button. See settings/NotificationsCard.tsx for turning notifications
// back off (or on again) afterward.
export function PushNotifications() {
  const permission = useSyncExternalStore(subscribeToNothing, getPermissionSnapshot, getServerPermissionSnapshot);

  useEffect(() => {
    if (permission === "granted") {
      subscribeToPushNotifications().catch((err) => Sentry.captureException(err));
    }
  }, [permission]);

  useEffect(() => {
    if (permission !== "default") return;

    async function handleFirstInteraction() {
      try {
        const result = await Notification.requestPermission();
        if (result === "granted") await subscribeToPushNotifications();
      } catch (err) {
        Sentry.captureException(err);
      }
    }

    document.addEventListener("pointerdown", handleFirstInteraction, { once: true });
    return () => document.removeEventListener("pointerdown", handleFirstInteraction);
  }, [permission]);

  return null;
}
