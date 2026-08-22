"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export type NavItem = {
  label: string;
  href?: string;
  children?: { label: string; href: string }[];
};

export function MainNav({ items, contactLabel }: { items: NavItem[]; contactLabel: string }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const pathname = usePathname();

  return (
    <>
      {/* desktop */}
      <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
        {items.map((item) =>
          item.children ? (
            <div key={item.label} className="relative group">
              <button
                className={`px-3 py-2 text-sm font-bold rounded-md flex items-center gap-1 hover:text-sky transition-colors ${
                  item.children.some((c) => pathname.startsWith(c.href)) ? "text-sky" : "text-ink"
                }`}
                aria-haspopup="true"
              >
                {item.label}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <div className="absolute left-0 top-full pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all z-40">
                <div className="bg-white rounded-xl shadow-lg border border-line py-2 min-w-56">
                  {item.children.map((c) => (
                    <Link
                      key={c.href}
                      href={c.href}
                      className={`block px-4 py-2 text-sm font-semibold hover:bg-cream hover:text-navy ${
                        pathname === c.href ? "text-sky" : "text-ink-soft"
                      }`}
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <Link
              key={item.label}
              href={item.href!}
              className={`px-3 py-2 text-sm font-bold rounded-md hover:text-sky transition-colors ${
                pathname === item.href ? "text-sky" : "text-ink"
              }`}
            >
              {item.label}
            </Link>
          )
        )}
        <Link
          href="/contact"
          className="ml-2 bg-navy hover:bg-navy-deep text-white text-sm font-bold rounded-lg px-4 py-2 transition-colors"
        >
          {contactLabel}
        </Link>
      </nav>

      {/* mobile trigger */}
      <button
        className="lg:hidden p-2 -mr-2"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
      </button>

      {/* mobile menu */}
      {open && (
        <div className="lg:hidden absolute left-0 right-0 top-full bg-white border-b border-line shadow-lg z-50 max-h-[70vh] overflow-y-auto">
          <nav className="px-4 py-3" aria-label="Mobile navigation">
            {items.map((item) =>
              item.children ? (
                <div key={item.label} className="border-b border-line/60 last:border-0">
                  <button
                    className="w-full flex items-center justify-between py-3 text-sm font-bold text-ink"
                    onClick={() => setExpanded(expanded === item.label ? null : item.label)}
                    aria-expanded={expanded === item.label}
                  >
                    {item.label}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      className={`transition-transform ${expanded === item.label ? "rotate-180" : ""}`}
                      aria-hidden
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  {expanded === item.label && (
                    <div className="pb-2">
                      {item.children.map((c) => (
                        <Link
                          key={c.href}
                          href={c.href}
                          onClick={() => setOpen(false)}
                          className="block py-2 pl-4 text-sm font-semibold text-ink-soft hover:text-sky"
                        >
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href!}
                  onClick={() => setOpen(false)}
                  className="block py-3 text-sm font-bold text-ink border-b border-line/60 last:border-0"
                >
                  {item.label}
                </Link>
              )
            )}
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="block mt-3 mb-2 bg-navy text-white text-center text-sm font-bold rounded-lg px-4 py-2.5"
            >
              {contactLabel}
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
