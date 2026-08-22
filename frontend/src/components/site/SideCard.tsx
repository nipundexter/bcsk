import Link from "next/link";
import { SCHOOL } from "@/lib/constants";

/** Contact + apply sidebar card used across interior pages. */
export function SideCard({ applyLabel = "Apply Now", contactLabel = "Contact Us" }: { applyLabel?: string; contactLabel?: string }) {
  return (
    <aside className="bg-cream rounded-2xl p-6 sticky top-24">
      <h2 className="font-display text-lg font-semibold text-navy">{contactLabel}</h2>
      <ul className="mt-3 space-y-2 text-sm text-ink-soft">
        <li>{SCHOOL.phone}</li>
        <li>{SCHOOL.phone2}</li>
        <li>
          <a className="text-sky hover:underline" href={`mailto:${SCHOOL.email}`}>
            {SCHOOL.email}
          </a>
        </li>
      </ul>
      <Link
        href="/apply"
        className="block mt-5 bg-sunrise hover:bg-sunrise-deep text-white text-center font-bold rounded-lg px-4 py-2.5 text-sm transition-colors"
      >
        {applyLabel}
      </Link>
      <a
        href={`https://wa.me/${SCHOOL.whatsapp.replace("+", "")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-2 bg-teal hover:bg-teal/85 text-white text-center font-bold rounded-lg px-4 py-2.5 text-sm transition-colors"
      >
        WhatsApp
      </a>
    </aside>
  );
}
