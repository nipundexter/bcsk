"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function PortalNav({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="mx-auto max-w-7xl px-4 flex gap-1 overflow-x-auto pb-0 no-print" aria-label="Portal navigation">
      {links.map((l) => {
        const active = pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap text-xs font-bold px-3 py-2.5 border-b-2 transition-colors ${
              active ? "border-sunrise text-navy" : "border-transparent text-ink-soft hover:text-navy"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
