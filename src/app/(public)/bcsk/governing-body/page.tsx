import { db } from "@/lib/db";
import { getDict } from "@/lib/i18n";
import { PageShell } from "@/components/site/PageShell";

/** FR-ABOUT-03: governing body member listing. */
export default async function GoverningBodyPage() {
  const { t } = await getDict();
  const members = await db.governingMember.findMany({
    where: { kind: "GOVERNING" },
    orderBy: { displayOrder: "asc" },
  });

  return (
    <PageShell title={t.nav.governingBody} eyebrow="BCSK">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((m, i) => (
          <div key={m.id} className="bg-white border border-line rounded-2xl p-6">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-display font-semibold text-white ${
                ["bg-navy", "bg-sky", "bg-teal", "bg-sunrise"][i % 4]
              }`}
              aria-hidden
            >
              {m.name.replace(/[()]/g, "").split(" ").slice(-2).map((w) => w[0]).join("")}
            </div>
            <h2 className="mt-4 font-bold text-ink leading-snug">{m.name}</h2>
            <p className="text-xs font-bold uppercase tracking-wide text-sunrise mt-1">{m.role}</p>
            {m.organization && <p className="mt-2 text-sm text-ink-soft leading-relaxed">{m.organization}</p>}
            <div className="mt-3 space-y-1 text-xs text-ink-soft">
              {m.phone && <p>{m.phone}</p>}
              {m.email && (
                <p>
                  <a className="text-sky hover:underline" href={`mailto:${m.email}`}>
                    {m.email}
                  </a>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
