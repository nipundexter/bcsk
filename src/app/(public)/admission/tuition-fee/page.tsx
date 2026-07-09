import { db } from "@/lib/db";
import { getDict } from "@/lib/i18n";
import { getSettings } from "@/lib/content";
import { PageShell } from "@/components/site/PageShell";

const krw = (n: number) => `₩${n.toLocaleString("en-US")}`;

/** FR-ADM-05: tuition fee table managed by the Admin Panel (FeeConfig). */
export default async function TuitionFeePage() {
  const { t } = await getDict();
  const [fees, settings] = await Promise.all([
    db.feeConfig.findMany({ where: { active: true }, orderBy: { displayOrder: "asc" } }),
    getSettings(["semester_1_dates", "semester_2_dates"]),
  ]);
  const regular = fees.filter((f) => f.kind === "REGULAR_CLASS");
  const special = fees.filter((f) => f.kind === "SPECIAL_COURSE");

  return (
    <PageShell title={t.nav.tuitionFee} eyebrow={t.nav.admission} cta={{ label: t.nav.applyNow, href: "/apply" }}>
      <div className="max-w-4xl space-y-12">
        <section>
          <h2 className="font-display text-2xl font-semibold text-navy mb-2">{t.nav.regularCourse}</h2>
          <p className="text-sm text-ink-soft mb-5">
            Semester 1: {settings.semester_1_dates} · Semester 2: {settings.semester_2_dates}
          </p>
          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream text-navy text-left">
                  <th className="px-5 py-3.5 font-bold">Class</th>
                  <th className="px-5 py-3.5 font-bold">Admission Fee</th>
                  <th className="px-5 py-3.5 font-bold">Semester Fee</th>
                  <th className="px-5 py-3.5 font-bold">Book Fee</th>
                </tr>
              </thead>
              <tbody>
                {regular.map((f) => (
                  <tr key={f.id} className="border-t border-line">
                    <td className="px-5 py-3.5 font-bold text-ink">{f.label}</td>
                    <td className="px-5 py-3.5">{krw(f.admissionFee)}</td>
                    <td className="px-5 py-3.5">{krw(f.semesterFee)}</td>
                    <td className="px-5 py-3.5">{f.bookFee ? krw(f.bookFee) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-ink-soft">
            Admission fee is paid once at admission. Continuing students pay only the semester fee (see Re-Admission).
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-semibold text-navy mb-5">{t.nav.specialCourses}</h2>
          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream text-navy text-left">
                  <th className="px-5 py-3.5 font-bold">Course</th>
                  <th className="px-5 py-3.5 font-bold">Admission Fee</th>
                  <th className="px-5 py-3.5 font-bold">BCSK Student</th>
                  <th className="px-5 py-3.5 font-bold">Non-BCSK Student</th>
                </tr>
              </thead>
              <tbody>
                {special.map((f) => (
                  <tr key={f.id} className="border-t border-line">
                    <td className="px-5 py-3.5 font-bold text-ink">{f.label}</td>
                    <td className="px-5 py-3.5">{krw(f.admissionFee)}</td>
                    <td className="px-5 py-3.5">{f.bcskPrice ? krw(f.bcskPrice) : "—"}</td>
                    <td className="px-5 py-3.5">{f.nonBcskPrice ? krw(f.nonBcskPrice) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-ink-soft">
            Special course fees are per semester per level. BCSK students are children currently enrolled in a
            regular class.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
