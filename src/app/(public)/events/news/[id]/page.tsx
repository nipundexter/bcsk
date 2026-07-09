import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getDict } from "@/lib/i18n";
import { PageShell } from "@/components/site/PageShell";
import { SideCard } from "@/components/site/SideCard";

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { lang } = await getDict();
  const item = await db.eventNews.findFirst({ where: { id: Number(id), published: true } });
  if (!item) notFound();

  return (
    <PageShell title={item.title} eyebrow={item.type}>
      <div className="grid lg:grid-cols-[1fr_280px] gap-10">
        <article className="max-w-3xl">
          <time className="text-xs font-bold text-ink-soft" dateTime={item.date.toISOString()}>
            {item.date.toLocaleDateString(lang === "bn" ? "bn-BD" : lang === "ko" ? "ko-KR" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
          </time>
          <div className="mt-4 text-[15px] text-ink leading-relaxed whitespace-pre-line">{item.body}</div>
        </article>
        <SideCard />
      </div>
    </PageShell>
  );
}
