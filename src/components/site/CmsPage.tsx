import { notFound } from "next/navigation";
import { getPage, renderMarkdown } from "@/lib/content";
import { getLang } from "@/lib/i18n";
import { PageShell } from "./PageShell";

/** Renders a CMS-managed content page (FR-ABOUT-01, FR-ADM-04, FR-ACAD-01 …). */
export async function CmsPage({
  slug,
  eyebrow,
  cta,
  children,
}: {
  slug: string;
  eyebrow?: string;
  cta?: { label: string; href: string };
  children?: React.ReactNode;
}) {
  const lang = await getLang();
  const page = await getPage(slug, lang);
  if (!page) notFound();
  return (
    <PageShell title={page.title} eyebrow={eyebrow} cta={cta}>
      <div className="grid lg:grid-cols-[1fr_280px] gap-10">
        <article
          className="prose-bcsk max-w-3xl text-[15px] text-ink"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(page.content) }}
        />
        <div>{children}</div>
      </div>
    </PageShell>
  );
}
