"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 overflow-y-auto py-3" aria-label="Admin navigation">
      {items.map((n) => {
        const active = pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            className={`block px-5 py-2.5 text-[13px] font-bold transition-colors ${
              active ? "bg-white/10 text-white border-l-[3px] border-sunrise" : "text-white/65 hover:text-white border-l-[3px] border-transparent"
            }`}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
