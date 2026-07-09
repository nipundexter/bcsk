import Link from "next/link";
import { SCHOOL } from "@/lib/constants";
import { getDict } from "@/lib/i18n";
import { LangSwitcher } from "./LangSwitcher";

/** FR-HOME-01: global top bar — WhatsApp, support email, portal logins, Apply Now, search, language switch. */
export async function TopBar() {
  const { lang, t } = await getDict();
  return (
    <div className="bg-navy text-white text-xs">
      <div className="mx-auto max-w-7xl px-4 h-9 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <a
            href={`https://wa.me/${SCHOOL.whatsapp.replace("+", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-sky-soft shrink-0"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M17.5 14.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07a8.2 8.2 0 0 1-2.4-1.49 9 9 0 0 1-1.66-2.07c-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.1 4.49.71.3 1.27.49 1.7.63.72.23 1.37.2 1.88.12.58-.09 1.76-.72 2-1.42.25-.7.25-1.29.18-1.42-.08-.12-.28-.2-.58-.35ZM12.05 21.8h-.03a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 1 1 8.4 4.63Zm8.4-18.3A11.8 11.8 0 0 0 12.04 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.6 5.95L.05 24l6.3-1.65a11.9 11.9 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9a11.82 11.82 0 0 0-3.48-8.4Z" />
            </svg>
            <span className="hidden sm:inline">{SCHOOL.whatsappDisplay}</span>
          </a>
          <a href={`mailto:${SCHOOL.email}`} className="hidden md:flex items-center gap-1.5 hover:text-sky-soft">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m2 7 10 6L22 7" />
            </svg>
            {SCHOOL.email}
          </a>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/classroom" className="hover:text-sky-soft font-semibold">
            {t.nav.classroom}
          </Link>
          <span className="text-white/30">·</span>
          <Link href="/office" className="hover:text-sky-soft font-semibold">
            {t.nav.office}
          </Link>
          <span className="text-white/30">·</span>
          <Link href="/admin" className="hover:text-sky-soft font-semibold">
            {t.nav.admin}
          </Link>
          <Link
            href="/apply"
            className="hidden sm:inline-block bg-sunrise hover:bg-sunrise-deep text-white font-bold rounded-md px-3 py-1 transition-colors"
          >
            {t.nav.applyNow}
          </Link>
          <Link href="/search" aria-label={t.nav.search} className="hover:text-sky-soft">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </Link>
          <LangSwitcher current={lang} />
        </div>
      </div>
    </div>
  );
}
