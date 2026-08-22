import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SCHOOL } from "@/lib/constants";
import { getDict } from "@/lib/i18n";

export async function Footer() {
  const { t } = await getDict();
  const year = new Date().getFullYear();

  const quick = [
    { label: t.nav.aboutUs, href: "/bcsk/about-us" },
    { label: t.nav.admissionProcess, href: "/admission/process" },
    { label: t.nav.tuitionFee, href: "/admission/tuition-fee" },
    { label: t.nav.academicCalendar, href: "/academic/calendar" },
    { label: t.nav.latestNews, href: "/events/news" },
    { label: t.nav.contact, href: "/contact" },
  ];
  const programs = [
    { label: t.nav.regularCourse, href: "/admission/regular-course" },
    { label: t.nav.deen, href: "/courses/deen" },
    { label: t.nav.ielts, href: "/courses/ielts-for-kids" },
    { label: t.nav.abacus, href: "/courses/abacus" },
    { label: t.nav.quranDepartment, href: "/admission/quran-department" },
    { label: t.nav.studentCorner, href: "/student-corner" },
  ];

  return (
    <footer className="bg-navy text-white mt-20">
      <div className="mx-auto max-w-7xl px-4 py-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo variant="light" />
          <p className="mt-4 text-sm text-white/70 leading-relaxed">{t.footer.tagline}</p>
          <div className="mt-4 flex gap-3">
            <a href={SCHOOL.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-9 h-9 rounded-full bg-white/10 hover:bg-sky flex items-center justify-center transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z" /></svg>
            </a>
            <a href={SCHOOL.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="w-9 h-9 rounded-full bg-white/10 hover:bg-sky flex items-center justify-center transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M23.5 6.2a3 3 0 0 0-2.1-2.2C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.2c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.2A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z" /></svg>
            </a>
            <a href={`https://wa.me/${SCHOOL.whatsapp.replace("+", "")}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-9 h-9 rounded-full bg-white/10 hover:bg-teal flex items-center justify-center transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M17.5 14.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07a8.2 8.2 0 0 1-2.4-1.49 9 9 0 0 1-1.66-2.07c-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.1 4.49.71.3 1.27.49 1.7.63.72.23 1.37.2 1.88.12.58-.09 1.76-.72 2-1.42.25-.7.25-1.29.18-1.42-.08-.12-.28-.2-.58-.35ZM12.05 21.8h-.03a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 1 1 8.4 4.63Zm8.4-18.3A11.8 11.8 0 0 0 12.04 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.6 5.95L.05 24l6.3-1.65a11.9 11.9 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9a11.82 11.82 0 0 0-3.48-8.4Z" /></svg>
            </a>
          </div>
        </div>
        <div>
          <h3 className="font-display font-semibold text-lg mb-4">{t.footer.quickLinks}</h3>
          <ul className="space-y-2.5 text-sm">
            {quick.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-white/70 hover:text-sky-soft transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-display font-semibold text-lg mb-4">{t.footer.programs}</h3>
          <ul className="space-y-2.5 text-sm">
            {programs.map((l) => (
              <li key={l.href + l.label}>
                <Link href={l.href} className="text-white/70 hover:text-sky-soft transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-display font-semibold text-lg mb-4">{t.footer.contactUs}</h3>
          <ul className="space-y-3 text-sm text-white/70">
            <li className="flex gap-2.5">
              <svg className="shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
              {SCHOOL.address}
            </li>
            <li className="flex gap-2.5 items-center">
              <svg className="shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.5 2.9.6a2 2 0 0 1 1.7 2Z" /></svg>
              <span>{SCHOOL.phone}<br />{SCHOOL.phone2}</span>
            </li>
            <li className="flex gap-2.5 items-center">
              <svg className="shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6L22 7" /></svg>
              <a href={`mailto:${SCHOOL.email}`} className="hover:text-sky-soft">{SCHOOL.email}</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <p>© {year} {SCHOOL.name}. {t.footer.rights}</p>
          <div className="flex gap-5">
            {/* NFR-LEGAL-02: policy links on every page */}
            <Link href="/privacy-policy" className="hover:text-sky-soft">{t.footer.privacy}</Link>
            <Link href="/refund-policy" className="hover:text-sky-soft">{t.footer.refund}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
