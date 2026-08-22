import Link from "next/link";
import { cms } from "@/services";
import { getDict } from "@/lib/i18n";
import { formatDate, isoAttr } from "@/lib/dates";
import { PageShell } from "@/components/site/PageShell";

/** FR-NEWS-01: latest news listing. */
export default async function NewsPage() {
  const { lang, t } = await getDict();
  const items = await cms.news(50);

  return (
    <PageShell title={t.nav.latestNews} eyebrow={t.nav.eventsNews}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl">
        {items.map((n) => (
          <Link key={n.id} href={`/events/news/${n.id}`} className="group bg-white border border-line rounded-2xl p-6 hover:shadow-md transition-shadow flex flex-col">
            <p className="text-xs font-bold uppercase tracking-wide text-sunrise">{n.type}</p>
            <h2 className="mt-2 font-display text-lg font-semibold text-navy group-hover:text-sky transition-colors leading-snug">
              {n.title}
            </h2>
            <p className="mt-2 text-sm text-ink-soft line-clamp-4">{n.body}</p>
            <time className="block mt-auto pt-3 text-xs text-ink-soft" dateTime={isoAttr(n.date)}>
              {formatDate(n.date, lang)}
            </time>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
