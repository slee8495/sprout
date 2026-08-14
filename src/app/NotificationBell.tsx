"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getNotifications, readAllNotifications, readNotification } from "./actions";
import { formatRelativeTime } from "@/lib/date";
import { useSettings } from "./SettingsProvider";

type Notification = {
  id: number;
  title: string;
  body: string;
  url: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export function NotificationBell() {
  const router = useRouter();
  const { t } = useSettings();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getNotifications()
      .then(({ items, unreadCount }) => {
        setItems(items);
        setUnreadCount(unreadCount);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, [open]);

  function toggleOpen() {
    setOpen((prev) => !prev);
  }

  function handleSelect(n: Notification) {
    setOpen(false);
    if (!n.readAt) {
      setUnreadCount((c) => Math.max(0, c - 1));
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, readAt: new Date() } : i)));
      readNotification(n.id).catch(() => {});
    }
    if (n.url) router.push(n.url);
  }

  function handleMarkAllRead() {
    setUnreadCount(0);
    setItems((prev) => prev.map((i) => (i.readAt ? i : { ...i, readAt: new Date() })));
    readAllNotifications().catch(() => {});
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        aria-label={t("Notifications")}
        className="relative flex items-center justify-center rounded-full px-3 py-1.5 text-center font-heading text-sm font-semibold text-brand-900 transition-transform hover:scale-105 hover:bg-brand-100/60 active:scale-95 dark:text-brand-100 dark:hover:bg-brand-900/30"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 max-h-96 w-80 overflow-y-auto rounded-2xl border border-brand-100 bg-white p-2 shadow-lg shadow-brand-900/10 dark:border-brand-900/40 dark:bg-zinc-900">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="font-heading text-sm font-semibold text-brand-900 dark:text-brand-100">
              {t("Notifications")}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-brand-700/70 hover:text-brand-900 dark:text-brand-300/70 dark:hover:text-brand-200"
              >
                {t("Mark all as read")}
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {t("No notifications yet")}
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(n)}
                    className={`flex w-full flex-col gap-0.5 rounded-xl px-2 py-2 text-left text-sm transition-colors hover:bg-brand-50 dark:hover:bg-brand-900/30 ${
                      !n.readAt ? "bg-brand-50/60 dark:bg-brand-900/20" : ""
                    }`}
                  >
                    <span className="flex items-center gap-1.5 font-semibold text-brand-900 dark:text-brand-100">
                      {!n.readAt && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
                      {n.title}
                    </span>
                    <span className="line-clamp-2 text-zinc-600 dark:text-zinc-400">{n.body}</span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">{formatRelativeTime(n.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
