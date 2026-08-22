import { notFound } from "next/navigation";
import { cms, ApiError } from "@/services";
import { getLang } from "@/lib/i18n";
import { PageShell } from "./PageShell";

/**
 * Renders a CMS-managed page.
 *
 * The backend returns sanitised HTML (SEC-6) rather than raw markdown, so the frontend
 * never runs a markdown parser and never has to remember to sanitise. Rendering pre-cleaned
 * HTML is the whole point of doing it server-side.
 */
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
  let page: Awaited<ReturnType<typeof cms.page>>;
  try {
    page = await cms.page(slug, lang);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <PageShell title={page.title} eyebrow={eyebrow} cta={cta}>
      <div className="grid lg:grid-cols-[1fr_280px] gap-10">
        <article
          className="prose-bcsk max-w-3xl text-[15px] text-ink"
          dangerouslySetInnerHTML={{ __html: page.html }}
        />
        <div>{children}</div>
      </div>
    </PageShell>
  );
}
