import Link from "next/link";
import { getDict } from "@/lib/i18n";
import { PageShell } from "@/components/site/PageShell";

/** FR-ADM-01: Apply Now — choose Regular Course or Special Course. */
export default async function ApplyPage() {
  const { t } = await getDict();
  return (
    <PageShell title={t.nav.applyNow} eyebrow={t.nav.admission}>
      <div className="grid sm:grid-cols-2 gap-6 max-w-3xl">
        <Link href="/apply/regular" className="group bg-cream hover:bg-cream-deep rounded-3xl p-8 transition-colors">
          <span className="inline-block w-12 h-12 rounded-full bg-navy text-white flex items-center justify-center text-xl" aria-hidden>🏫</span>
          <h2 className="mt-4 font-display text-2xl font-semibold text-navy">{t.nav.regularCourse}</h2>
          <p className="mt-2 text-sm text-ink-soft leading-relaxed">
            Pre-Primary to Class 5 — the full NCTB curriculum: Bangla, English, Mathematics, Science, BGS, and
            Religious Studies.
          </p>
          <span className="inline-block mt-4 text-sunrise font-bold text-sm">Start application →</span>
        </Link>
        <Link href="/apply/special" className="group bg-sky-soft hover:bg-sky-soft/70 rounded-3xl p-8 transition-colors">
          <span className="inline-block w-12 h-12 rounded-full bg-sky text-white flex items-center justify-center text-xl" aria-hidden>🌟</span>
          <h2 className="mt-4 font-display text-2xl font-semibold text-navy">{t.nav.specialCourse}</h2>
          <p className="mt-2 text-sm text-ink-soft leading-relaxed">
            IELTS for Kids, Abacus, Qur'an & Deen, Hifz, Debate Club, or Bangla Language — open to BCSK and
            non-BCSK students.
          </p>
          <span className="inline-block mt-4 text-sunrise font-bold text-sm">Start application →</span>
        </Link>
      </div>
      <p className="mt-8 text-sm text-ink-soft max-w-2xl">
        After the form you'll continue to payment — card or Hana Bank transfer. Review the{" "}
        <Link href="/admission/tuition-fee" className="text-sky font-bold hover:underline">tuition fee table</Link> and{" "}
        <Link href="/admission/process" className="text-sky font-bold hover:underline">admission process</Link> first if
        you haven't.
      </p>
    </PageShell>
  );
}
