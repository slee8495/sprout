"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Journal" },
  { href: "/milestones", label: "Milestones" },
  { href: "/growth", label: "Growth" },
  { href: "/time-capsules", label: "Time Capsules" },
  { href: "/photobook", label: "Photobook" },
];

export function NavBar() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <nav className="sticky top-0 z-10 flex gap-1 overflow-x-auto border-b border-zinc-200 bg-white/90 px-2 py-2 backdrop-blur dark:border-zinc-800 dark:bg-black/90 print:hidden">
      {LINKS.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium ${
              active
                ? "bg-emerald-700 text-white"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
