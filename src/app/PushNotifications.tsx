"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { subscribeToPush } from "./actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

async function registerAndSubscribe() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) return;

  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    }));

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;

  await subscribeToPush({
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  });
}

function isPushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function getPermissionSnapshot(): NotificationPermission | "unsupported" {
  return isPushSupported() ? Notification.permission : "unsupported";
}

function getServerPermissionSnapshot(): NotificationPermission | "unsupported" {
  return "unsupported";
}

function subscribeToNothing() {
  return () => {};
}

export function PushNotifications() {
  const permission = useSyncExternalStore(subscribeToNothing, getPermissionSnapshot, getServerPermissionSnapshot);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (permission === "granted") {
      registerAndSubscribe().catch(() => {});
    }
  }, [permission]);

  async function handleEnable() {
    setPending(true);
    try {
      const result = await Notification.requestPermission();
      if (result === "granted") await registerAndSubscribe();
    } finally {
      setPending(false);
    }
  }

  if (permission !== "default") return null;

  return (
    <button
      onClick={handleEnable}
      disabled={pending}
      className="fixed bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-emerald-600 px-4 py-2 font-heading text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 print:hidden"
    >
      {pending ? "켜는 중…" : "🔔 새 글 알림 켜기"}
    </button>
  );
}
