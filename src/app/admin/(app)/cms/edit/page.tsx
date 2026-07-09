import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { LANGS } from "@/lib/constants";
import { PageEditor } from "../PageEditor";

export default async function CmsEditPage({ searchParams }: { searchParams: Promise<{ slug?: string; lang?: string }> }) {
  await requireAdmin();
  const { slug = "", lang = "en" } = await searchParams;
  const page = slug ? await db.contentPage.findUnique({ where: { slug_lang: { slug, lang } } }) : null;
  const fallback = !page && slug ? await db.contentPage.findUnique({ where: { slug_lang: { slug, lang: "en" } } }) : null;
  const langLabel = LANGS.find((l) => l.code === lang)?.label ?? lang;

  return (
    <PageEditor
      slug={slug}
      lang={lang}
      langLabel={langLabel}
      initialTitle={page?.title ?? fallback?.title ?? ""}
      initialContent={page?.content ?? fallback?.content ?? ""}
      published={(page?.status ?? "PUBLISHED") === "PUBLISHED"}
      exists={!!page}
      isNew={false}
    />
  );
}
