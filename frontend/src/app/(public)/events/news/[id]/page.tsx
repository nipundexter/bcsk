import { notFound } from "next/navigation";
import { cms, ApiError } from "@/services";
import { getDict } from "@/lib/i18n";
import { formatDate, isoAttr } from "@/lib/dates";
import { PageShell } from "@/components/site/PageShell";
import { SideCard } from "@/components/site/SideCard";

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { lang } = await getDict();
  let item: Awaited<ReturnType<typeof cms.newsItem>>;
  try {
    item = await cms.newsItem(Number(id));
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <PageShell title={item.title} eyebrow={item.type}>
      <div className="grid lg:grid-cols-[1fr_280px] gap-10">
        <article className="max-w-3xl">
          <time className="text-xs font-bold text-ink-soft" dateTime={isoAttr(item.date)}>
            {formatDate(item.date, lang)}
          </time>
          <div className="mt-4 text-[15px] text-ink leading-relaxed prose-bcsk" dangerouslySetInnerHTML={{ __html: item.html }} />
        </article>
        <SideCard />
      </div>
    </PageShell>
  );
}
