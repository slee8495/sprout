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
  // In the native iOS app, WKWebView re-derives env(safe-area-inset-top) *during* a scroll gesture
  // (a side effect of ios.contentInset: "automatic" in capacitor.config.ts), so a live env() in the
  // padding makes this fixed bar visibly slide as you scroll. The padding itself is still required
  // — contentInset only shifts scrolled content, and a fixed element sits over the status bar
  // without it — so measure the inset once and freeze it as a px value. Re-measured on rotation
  // only, which is the one time it legitimately changes; scrolling never triggers it.
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") return;

    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;top:0;left:0;visibility:hidden;padding-top:env(safe-area-inset-top)";
    document.body.appendChild(probe);

    const measure = () => {
      const inset = Number.parseFloat(getComputedStyle(probe).paddingTop) || 0;
      document.documentElement.style.setProperty("--navbar-safe-top", `${inset}px`);
    };
    measure();
    // Rotation reports the new inset a frame or two after the event fires.
    const remeasure = () => requestAnimationFrame(() => requestAnimationFrame(measure));
    window.addEventListener("orientationchange", remeasure);

    return () => {
      window.removeEventListener("orientationchange", remeasure);
      probe.remove();
    };
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
