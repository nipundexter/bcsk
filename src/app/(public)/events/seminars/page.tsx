import Link from "next/link";
import { db } from "@/lib/db";
import { getDict } from "@/lib/i18n";
import { PageShell } from "@/components/site/PageShell";

/** FR-NEWS-01: seminar updates. */
export default async function SeminarsPage() {
  const { lang, t } = await getDict();
  const items = await db.eventNews.findMany({
    where: { published: true, type: "SEMINAR" },
    orderBy: { date: "desc" },
  });

  return (
    <PageShell title={t.nav.seminarUpdate} eyebrow={t.nav.eventsNews}>
      <div className="max-w-3xl space-y-4">
        {items.length === 0 && (
          <p className="text-sm text-ink-soft">No seminars announced yet. Check the Latest News page for other updates.</p>
        )}
        {items.map((n) => (
          <Link key={n.id} href={`/events/news/${n.id}`} className="group flex gap-5 bg-white border border-line rounded-2xl p-6 hover:shadow-md transition-shadow">
            <div className="bg-cream rounded-xl px-4 py-3 text-center shrink-0 self-start">
              <p className="font-display text-2xl font-semibold text-navy">{n.date.getDate()}</p>
              <p className="text-xs font-bold uppercase text-ink-soft">
                {n.date.toLocaleDateString(lang === "bn" ? "bn-BD" : lang === "ko" ? "ko-KR" : "en-US", { month: "short" })}
              </p>
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-navy group-hover:text-sky transition-colors">{n.title}</h2>
              <p className="mt-1.5 text-sm text-ink-soft line-clamp-2">{n.body}</p>
            </div>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
