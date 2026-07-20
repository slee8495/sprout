"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Journal" },
  { href: "/feed", label: "Feed" },
  { href: "/milestones", label: "Milestones" },
];

export function NavBar() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/onboarding") return null;

  return (
    <nav className="sticky top-0 z-10 flex gap-1 border-b border-emerald-100/70 bg-[#fff9f0]/90 px-2 py-2 backdrop-blur dark:border-emerald-900/40 dark:bg-[#1f2420]/90 print:hidden">
      {LINKS.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex-1 whitespace-nowrap rounded-full px-3 py-1.5 text-center font-heading text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
              active
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-900/20"
                : "text-emerald-900 hover:bg-emerald-100/60 dark:text-emerald-100 dark:hover:bg-emerald-900/30"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
      <Link
        href="/settings"
        aria-label="Settings"
        className={`flex items-center justify-center rounded-full px-3 py-1.5 text-center font-heading text-sm font-semibold transition-transform hover:scale-105 active:scale-95 ${
          pathname.startsWith("/settings")
            ? "bg-emerald-600 text-white shadow-sm shadow-emerald-900/20"
            : "text-emerald-900 hover:bg-emerald-100/60 dark:text-emerald-100 dark:hover:bg-emerald-900/30"
        }`}
      >
        ⚙️
      </Link>
    </nav>
  );
}
