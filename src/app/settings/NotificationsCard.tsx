"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useSettings } from "../SettingsProvider";
import {
  getActivePushSubscription,
  isPushSupported,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from "@/lib/webPush";

function getPermissionSnapshot(): NotificationPermission | "unsupported" {
  return isPushSupported() ? Notification.permission : "unsupported";
}

function getServerPermissionSnapshot(): NotificationPermission | "unsupported" {
  return "unsupported";
}

function subscribeToNothing() {
  return () => {};
}

// Subscription state on top of the granted/denied/default permission — whether there's actually
// an active push subscription right now, so Settings reflects a Settings-driven opt-out (not
// just OS-level permission).
type SubscriptionState = "loading" | "on" | "off";

export function NotificationsCard() {
  const { t } = useSettings();
  const permission = useSyncExternalStore(subscribeToNothing, getPermissionSnapshot, getServerPermissionSnapshot);
  const [subscription, setSubscription] = useState<SubscriptionState>("loading");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (permission !== "granted") return;
    getActivePushSubscription().then((sub) => setSubscription(sub ? "on" : "off"));
  }, [permission]);

  async function handleToggle() {
    setPending(true);
    try {
      if (subscription === "on") {
        await unsubscribeFromPushNotifications();
        setSubscription("off");
      } else {
        if (permission === "default") {
          const result = await Notification.requestPermission();
          if (result !== "granted") return;
        }
        await subscribeToPushNotifications();
        setSubscription("on");
      }
    } catch (err) {
      Sentry.captureException(err);
    } finally {
      setPending(false);
    }
  }

  if (permission === "unsupported") return null;

  const isOn = permission === "granted" && subscription === "on";
  const isLoading = permission === "granted" && subscription === "loading";

  return (
    <section className="flex flex-col gap-2 rounded-3xl border border-brand-200/70 bg-white p-4 dark:border-brand-800/50 dark:bg-zinc-900">
      <h2 className="font-heading text-sm font-semibold text-brand-800 dark:text-brand-200">{t("Notifications")}</h2>
      {permission === "denied" ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t("Blocked in your device settings. Enable notifications for Roun there to turn this back on.")}
        </p>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t(isOn ? "New entries and comments push to your phone." : "Notifications are off.")}
          </p>
          <button
            type="button"
            onClick={handleToggle}
            disabled={isLoading || pending}
            role="switch"
            aria-checked={isOn}
            className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-colors disabled:opacity-50 ${
              isOn ? "bg-brand-600" : "bg-zinc-300 dark:bg-zinc-700"
            }`}
          >
            <span
              className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                isOn ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      )}
    </section>
  );
}
