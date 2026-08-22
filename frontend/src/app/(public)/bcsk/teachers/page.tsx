import { cms } from "@/services";
import { getDict } from "@/lib/i18n";
import { PageShell } from "@/components/site/PageShell";

/** FR-ABOUT-02: staff list with photo, name, designation, bio — editable via Admin Panel. */
export default async function TeachersPage() {
  const { t } = await getDict();
  // Phase D: reads the API instead of the database. The backend decides which fields are
  // public, so a teacher's email and login id cannot leak into this page by accident.
  const teachers = await cms.teachers();

  return (
    <PageShell title={t.nav.teachers} eyebrow="BCSK">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map((tp, i) => (
          <div key={tp.teacherId} className="bg-white border border-line rounded-2xl p-6 flex flex-col">
            <div className="flex items-center gap-4">
              {tp.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tp.photoUrl} alt={tp.name} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-display font-semibold text-white shrink-0 ${
                    ["bg-navy", "bg-sky", "bg-teal", "bg-sunrise"][i % 4]
                  }`}
                  aria-hidden
                >
                  {tp.name.split(" ").slice(-2).map((w) => w[0]).join("")}
                </div>
              )}
              <div>
                <h2 className="font-bold text-ink leading-snug">{tp.name}</h2>
                <p className="text-xs font-bold uppercase tracking-wide text-sunrise mt-0.5">{tp.designation}</p>
              </div>
            </div>
            {tp.bio && <p className="mt-4 text-sm text-ink-soft leading-relaxed">{tp.bio}</p>}
            {tp.subjects && (
              <p className="mt-auto pt-4 text-xs text-ink-soft">
                <span className="font-bold text-navy">{t.common.teacher}:</span> {tp.subjects}
              </p>
            )}
          </div>
        ))}
      </div>
    </PageShell>
  );
}
