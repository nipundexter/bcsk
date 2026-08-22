import { cms } from "@/services";
import { getDict } from "@/lib/i18n";
import { PageShell } from "@/components/site/PageShell";
import { SCHOOL } from "@/lib/constants";

/** FR-ABOUT-03: regional representatives listing. */
export default async function RegionalRepsPage() {
  const { t } = await getDict();
  const members = await cms.regionalReps();

  return (
    <PageShell title={t.nav.regionalReps} eyebrow="BCSK">
      <div className="max-w-3xl">
        <div className="grid sm:grid-cols-2 gap-6">
          {members.map((m) => (
            <div key={m.id} className="bg-white border border-line rounded-2xl p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-sky">{m.region}</p>
              <h2 className="mt-1 font-bold text-ink">{m.name}</h2>
              <p className="text-xs text-ink-soft mt-0.5">{m.role}</p>
              {m.bio && <p className="mt-3 text-sm text-ink-soft leading-relaxed">{m.bio}</p>}
            </div>
          ))}
        </div>
        <div className="mt-8 bg-cream rounded-2xl p-6">
          <h2 className="font-display text-lg font-semibold text-navy">Become a representative</h2>
          <p className="mt-2 text-sm text-ink-soft">
            BCSK is recruiting regional representatives across South Korea. If you would like to represent your
            city, contact the office at {SCHOOL.email} or {SCHOOL.phone2}.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
