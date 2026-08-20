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
  // capacitor.config.ts sets ios.contentInset: "automatic", which makes WKWebView inset the
  // scrolled content past the safe area natively. Adding env(safe-area-inset-top) padding on top
  // of that double-counts the notch — and because iOS re-derives that automatic inset *during* a
  // scroll gesture, the nav visibly slides down as you scroll. On native iOS the native inset
  // already covers it, so the CSS padding has to come off; every other platform still needs it.
  useEffect(() => {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
      document.documentElement.style.setProperty("--navbar-safe-top", "0px");
    }
  }, []);

  // `position: sticky` visually lags/detaches during iOS WKWebView's rubber-band scroll bounce
  // (the native app's rendering engine), briefly leaving a gap above the nav that shows the page
  // background. `fixed` sidesteps that whole class of bug by never re-deriving its position from
  // scroll at all, but that means it no longer reserves its own space in the document flow — this
  // measures its real (safe-area-dependent) height and feeds it to the layout as a CSS var so
  // page content gets exactly that much top padding instead of hiding underneath it.
  useEffect(() => {
    if (hidden) {
      document.documentElement.style.setProperty("--navbar-height", "0px");
      return;
    }
    const el = navRef.current;
    if (!el) return;
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
      className="fixed inset-x-0 top-0 z-10 flex gap-1 border-b border-brand-100/70 bg-[#fff9f0]/90 px-2 py-2 backdrop-blur dark:border-brand-900/40 dark:bg-[#1f2420]/90 print:hidden"
      // translateZ keeps it on its own compositing layer, so WKWebView repaints it continuously
      // during a scroll gesture rather than only snapping it back once the gesture ends.
      style={{
        paddingTop: "calc(var(--navbar-safe-top, env(safe-area-inset-top)) + 0.5rem)",
        transform: "translateZ(0)",
        willChange: "transform",
      }}
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
