import { requirePermission } from "@/lib/auth";
import { admin } from "@/services";
import { LANGS } from "@/lib/constants";
import { PageEditor } from "../PageEditor";

export default async function CmsEditPage({ searchParams }: { searchParams: Promise<{ slug?: string; lang?: string }> }) {
  await requirePermission("content:manage");
  const { slug = "", lang = "en" } = await searchParams;
  const page = slug ? await admin.page(slug, lang) : null;
  // A translation that does not exist yet opens pre-filled from English rather than blank.
  const fallback = !page && slug ? await admin.page(slug, "en") : null;
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
