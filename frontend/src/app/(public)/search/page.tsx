import Link from "next/link";
import { site } from "@/services";
import { getDict } from "@/lib/i18n";
import { PageShell } from "@/components/site/PageShell";

const PAGE_ROUTES: Record<string, string> = {
  "about-us": "/bcsk/about-us",
  "education-process": "/bcsk/education-process",
  administration: "/bcsk/administration",
  "message-chairman": "/bcsk/message-chairman",
  "message-principal": "/bcsk/message-principal",
  "our-community": "/bcsk/our-community",
  "admission-process": "/admission/process",
  "regular-course": "/admission/regular-course",
  "special-course": "/admission/special-course",
  "quran-department": "/admission/quran-department",
  "re-admission": "/admission/re-admission",
  brochure: "/admission/brochure",
  "book-list": "/academic/book-list",
  syllabus: "/academic/syllabus",
  "academic-calendar": "/academic/calendar",
  "class-schedule": "/academic/class-schedule",
  "why-bcsk": "/#school-overview",
  "mission-vision": "/#school-overview",
  "education-management": "/#school-overview",
  "privacy-policy": "/privacy-policy",
  "refund-policy": "/refund-policy",
};

/** FR-HOME-06: global site search across pages, courses, and news/events. */
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const { lang, t } = await getDict();
  const query = q.trim();

  // One search call rather than three queries: the backend owns the query shape, which is
  // where it belongs once full-text search replaces the current LIKE scan (PERF/search).
  const { pages, courses, news } = query
    ? await site.search(query, lang)
    : { pages: [], courses: [], news: [] };

  const total = pages.length + courses.length + news.length;

  return (
    <PageShell title={t.common.search} eyebrow="BCSK">
      <div className="max-w-2xl">
        <form action="/search" method="get" className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder={`${t.common.search}…`}
            className="flex-1 rounded-lg border border-line px-4 py-3 text-sm focus:border-sky focus:outline-none"
            autoFocus
          />
          <button className="bg-navy hover:bg-navy-deep text-white font-bold rounded-lg px-6 text-sm transition-colors">
            {t.common.search}
          </button>
        </form>

        {query && (
          <p className="mt-6 text-sm text-ink-soft">
            {total > 0 ? `${total} result${total === 1 ? "" : "s"} for “${query}”` : t.common.noResults}
          </p>
        )}

        <div className="mt-6 space-y-8">
          {pages.length > 0 && (
            <section>
              <h2 className="text-xs font-extrabold uppercase tracking-wide text-sunrise mb-3">Pages</h2>
              <ul className="space-y-3">
                {pages.map((p) => (
                  <li key={p.id}>
                    <Link href={PAGE_ROUTES[p.slug] ?? "/"} className="group block bg-white border border-line rounded-xl p-4 hover:shadow-sm">
                      <span className="font-bold text-navy group-hover:text-sky">{p.title}</span>
                      <span className="block text-xs text-ink-soft mt-1 line-clamp-2">{p.content.replace(/[#*|]/g, "").slice(0, 180)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {courses.length > 0 && (
            <section>
              <h2 className="text-xs font-extrabold uppercase tracking-wide text-sunrise mb-3">Courses</h2>
              <ul className="space-y-3">
                {courses.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={["deen", "ielts-for-kids", "abacus"].includes(c.slug) ? `/courses/${c.slug}` : "/admission/special-course"}
                      className="group block bg-white border border-line rounded-xl p-4 hover:shadow-sm"
                    >
                      <span className="font-bold text-navy group-hover:text-sky">{c.name}</span>
                      <span className="block text-xs text-ink-soft mt-1 line-clamp-2">{c.description}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {news.length > 0 && (
            <section>
              <h2 className="text-xs font-extrabold uppercase tracking-wide text-sunrise mb-3">News & Events</h2>
              <ul className="space-y-3">
                {news.map((n) => (
                  <li key={n.id}>
                    <Link href={`/events/news/${n.id}`} className="group block bg-white border border-line rounded-xl p-4 hover:shadow-sm">
                      <span className="font-bold text-navy group-hover:text-sky">{n.title}</span>
                      <span className="block text-xs text-ink-soft mt-1 line-clamp-2">{n.body}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </PageShell>
  );
}
