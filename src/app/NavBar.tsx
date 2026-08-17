"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationBell } from "./NotificationBell";
import { useSettings } from "./SettingsProvider";

const LINKS = [
  { href: "/", label: "Journal" },
  { href: "/feed", label: "Feed" },
  { href: "/milestones", label: "Milestones" },
  { href: "/library", label: "Albums" },
];

export function NavBar() {
  const pathname = usePathname();
  const { t } = useSettings();

  if (
    [
      "/login",
      "/onboarding",
      "/connect",
      "/signup",
      "/join",
      "/privacy",
      "/terms",
      "/account-deletion",
      "/get-app",
    ].includes(pathname)
  )
    return null;

  return (
    <nav className="sticky top-0 z-10 flex gap-1 border-b border-brand-100/70 bg-[#fff9f0]/90 px-2 py-2 backdrop-blur dark:border-brand-900/40 dark:bg-[#1f2420]/90 print:hidden">
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
