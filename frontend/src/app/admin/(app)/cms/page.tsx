import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { admin, type ContentPageRow } from "@/services";
import { LANGS } from "@/lib/constants";

/** FR-ADMIN-02: CMS module — all public content pages in all languages. */
export default async function CmsListPage() {
  await requirePermission("content:manage");
  const pages = await admin.pages();

  const bySlug = new Map<string, ContentPageRow[]>();
  for (const p of pages) {
    bySlug.set(p.slug, [...(bySlug.get(p.slug) ?? []), p]);
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold text-navy">CMS Pages</h1>
        <Link href="/admin/cms/new" className="bg-sunrise hover:bg-sunrise-deep text-white text-xs font-bold rounded-lg px-4 py-2.5 transition-colors">
          + New page
        </Link>
      </div>
      <div className="bg-white rounded-2xl border border-line divide-y divide-line">
        {[...bySlug.entries()].map(([slug, versions]) => (
          <div key={slug} className="px-5 py-3.5 flex flex-wrap items-center gap-3">
            <div className="min-w-52">
              <p className="font-bold text-ink text-sm">{versions[0]!.title}</p>
              <p className="text-[11px] text-ink-soft font-mono">{slug}</p>
            </div>
            <div className="flex gap-1.5 ml-auto">
              {LANGS.map((l) => {
                const v = versions.find((x) => x.lang === l.code);
                return (
                  <Link
                    key={l.code}
                    href={`/admin/cms/edit?slug=${slug}&lang=${l.code}`}
                    className={`text-[11px] font-bold rounded-full px-3 py-1.5 transition-colors ${
                      v
                        ? v.status === "PUBLISHED"
                          ? "bg-teal/15 text-teal hover:bg-teal/25"
                          : "bg-sunrise/15 text-sunrise-deep hover:bg-sunrise/25"
                        : "bg-cream text-ink-soft hover:text-navy"
                    }`}
                    title={v ? `${l.label}: ${v.status}` : `${l.label}: not created`}
                  >
                    {l.code.toUpperCase()}
                    {v ? (v.status === "PUBLISHED" ? " ●" : " ◐") : " ○"}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-soft">● published · ◐ draft · ○ not created (falls back to English)</p>
    </div>
  );
}
