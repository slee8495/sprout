"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { NotificationBell } from "./NotificationBell";
import { useSettings } from "./SettingsProvider";

const LINKS = [
  { href: "/", label: "Journal" },
  { href: "/feed", label: "Feed" },
  { href: "/milestones", label: "Milestones" },
  { href: "/library", label: "Albums" },
];

const HIDDEN_ON = [
  "/login",
  "/onboarding",
  "/connect",
  "/signup",
  "/join",
  "/privacy",
  "/terms",
  "/account-deletion",
  "/get-app",
];

export function NavBar() {
  const pathname = usePathname();
  const { t } = useSettings();
  const navRef = useRef<HTMLElement>(null);
  const hidden = HIDDEN_ON.includes(pathname);

  // WKWebView repositions `position: fixed` elements mid-scroll-gesture, which no amount of CSS on
  // the element itself fixes — the nav either slid down with the content or, with its safe-area
  // padding removed, sat under the status bar. So the native app opts into an app-shell layout
  // instead (see .native-shell in globals.css): the body stops scrolling, only the content column
  // does, and the nav goes back to being a plain static element nothing can reposition. The web
  // keeps the fixed nav, where it behaves correctly and page-level scrolling is what users expect.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    document.documentElement.classList.add("native-shell");
    return () => document.documentElement.classList.remove("native-shell");
  }, []);

  // The fixed (web) nav reserves no space in document flow, so its measured height is published
  // here and layout.tsx pads the content column by it. In the shell layout the nav is static and
  // already takes up its own space, so that padding has to go back to zero.
  useEffect(() => {
    const el = navRef.current;
    if (hidden || !el || Capacitor.isNativePlatform()) {
      document.documentElement.style.setProperty("--navbar-height", "0px");
      return;
    }
    const setHeight = () => document.documentElement.style.setProperty("--navbar-height", `${el.offsetHeight}px`);
    setHeight();
    const observer = new ResizeObserver(setHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, [hidden]);

  if (hidden) return null;

  return (
    <nav
      ref={navRef}
      // .app-nav owns padding-top (globals.css) rather than an inline style, because the shell
      // layout needs to override it and an inline style would outrank any rule that tried.
      className="app-nav fixed inset-x-0 top-0 z-10 flex gap-1 border-b border-brand-100/70 bg-[#fff9f0]/90 px-2 py-2 backdrop-blur dark:border-brand-900/40 dark:bg-[#1f2420]/90 print:hidden"
    >
      {LINKS.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex-1 whitespace-nowrap rounded-full px-3 py-1.5 text-center font-heading text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
              active
                ? "bg-brand-600 text-white shadow-sm shadow-brand-900/20"
                : "text-brand-900 hover:bg-brand-100/60 dark:text-brand-100 dark:hover:bg-brand-900/30"
            }`}
          >
            {t(link.label)}
          </Link>
        );
      })}
      <NotificationBell />
      <Link
        href="/settings"
        aria-label={t("Settings")}
        className={`flex items-center justify-center rounded-full px-3 py-1.5 text-center font-heading text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
          pathname.startsWith("/settings")
            ? "bg-brand-600 text-white shadow-sm shadow-brand-900/20"
            : "text-brand-900 hover:bg-brand-100/60 dark:text-brand-100 dark:hover:bg-brand-900/30"
        }`}
      >
        ⚙️
      </Link>
    </nav>
  );
}
