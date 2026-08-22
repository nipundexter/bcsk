import Link from "next/link";
import { site, cms } from "@/services";
import { getSession } from "@/lib/auth";
import { SEMESTER_CURRENT } from "@/lib/constants";
import { krw } from "@/lib/format";
import { PracticeQuiz } from "./PracticeQuiz";

const SKILLS = [
  { name: "Listening", icon: "🎧", text: "Native-speaker dialogues, songs, and stories tuned to each level." },
  { name: "Speaking", icon: "🗣️", text: "Confidence-first conversation practice in small groups." },
  { name: "Reading", icon: "📖", text: "From picture books to short passages with comprehension questions." },
  { name: "Writing", icon: "✍️", text: "Guided sentences to short essays with teacher feedback." },
];

/** 3.8.2 IELTS for Kids learning page (FR-IELTS-01..06). */
export default async function IeltsPage() {
  const [course, fees, slugs, session] = await Promise.all([
    site.course("ielts-for-kids"),
    cms.fees(),
    site.enrolledCourseSlugs(),
    getSession(),
  ]);
  const fee = fees.find((f) => f.key === "ielts_for_kids") ?? null;
  const enrolled = slugs.includes("ielts-for-kids");
  const studentUserId = session?.role === "STUDENT" ? session.userId : null;

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pt-6">
        <div className="relative bg-sky rounded-3xl px-6 sm:px-12 py-14 overflow-hidden text-white">
          <div className="absolute -right-8 -bottom-16 w-64 h-64 rounded-full bg-white/10" aria-hidden />
          <p className="relative text-xs font-extrabold tracking-[0.2em] uppercase text-white/80">IELTS for Kids</p>
          <h1 className="relative mt-3 font-display text-4xl sm:text-5xl font-semibold max-w-2xl leading-tight">
            {course?.heroText ?? "Give your child a global voice"}
          </h1>
          <p className="relative mt-4 text-white/85 text-sm max-w-xl leading-relaxed">
            {course?.description} Taught by native English speakers across nine progressive levels.
          </p>
          <Link
            href="/apply/special?course=ielts-for-kids"
            className="relative inline-block mt-7 bg-sunrise hover:bg-sunrise-deep text-white font-bold rounded-lg px-7 py-3 text-sm transition-colors"
          >
            Apply for IELTS for Kids
          </Link>
        </div>
      </section>

      {/* four skills (FR-IELTS-01) */}
      <section className="mx-auto max-w-7xl px-4 mt-16">
        <h2 className="font-display text-3xl font-semibold text-ink mb-6">The Four Skills</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SKILLS.map((s) => (
            <div key={s.name} className="bg-white border border-line rounded-2xl p-6">
              <span className="text-3xl" aria-hidden>{s.icon}</span>
              <h3 className="mt-3 font-display text-lg font-semibold text-navy">{s.name}</h3>
              <p className="mt-1.5 text-sm text-ink-soft leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* levels + schedule (FR-IELTS-02) */}
      <section className="mx-auto max-w-7xl px-4 mt-16 grid lg:grid-cols-2 gap-10">
        <div>
          <h2 className="font-display text-3xl font-semibold text-ink mb-6">Levels 1–9</h2>
          <div className="space-y-3">
            {course?.levels.map((l) => {
              const session = course.sessions.find((s) => s.courseLevelId === l.id);
              return (
                <details key={l.id} className="bg-white border border-line rounded-2xl group">
                  <summary className="cursor-pointer px-6 py-4 font-bold text-navy flex items-center gap-3">
                    {l.name}
                    {session && (
                      <span className="text-[11px] font-bold bg-sky-soft text-navy rounded-full px-2.5 py-1">
                        {session.dayOfWeek} {session.startTime}
                      </span>
                    )}
                    <span className="ml-auto text-sky group-open:rotate-180 transition-transform" aria-hidden>▾</span>
                  </summary>
                  <div className="px-6 pb-5 text-sm text-ink-soft leading-relaxed">
                    {l.syllabus}
                    {session && enrolled && session.zoomLink && (
                      <a href={session.zoomLink} target="_blank" rel="noopener noreferrer" className="block mt-3 text-teal font-bold hover:underline">
                        Join the live class →
                      </a>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        </div>

        {/* pricing (FR-IELTS-03) */}
        <div>
          <h2 className="font-display text-3xl font-semibold text-ink mb-6">Course Fee</h2>
          <div className="bg-cream rounded-3xl p-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-6 text-center">
                <p className="text-xs font-extrabold uppercase tracking-wide text-teal">BCSK Student</p>
                <p className="mt-2 font-display text-3xl font-semibold text-navy">{fee?.bcskPrice ? krw(fee.bcskPrice) : "—"}</p>
                <p className="text-xs text-ink-soft mt-1">per level / semester</p>
              </div>
              <div className="bg-white rounded-2xl p-6 text-center">
                <p className="text-xs font-extrabold uppercase tracking-wide text-sunrise">Non-BCSK Student</p>
                <p className="mt-2 font-display text-3xl font-semibold text-navy">{fee?.nonBcskPrice ? krw(fee.nonBcskPrice) : "—"}</p>
                <p className="text-xs text-ink-soft mt-1">per level / semester</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-ink-soft">
              Plus a one-time admission fee of {fee ? krw(fee.admissionFee) : "—"}. Fees are managed by the school
              office and may be updated each session.
            </p>
            <Link
              href="/apply/special?course=ielts-for-kids"
              className="block mt-5 bg-navy hover:bg-navy-deep text-white text-center font-bold rounded-lg px-6 py-3 text-sm transition-colors"
            >
              Enroll now
            </Link>
          </div>
        </div>
      </section>

      {/* practice (FR-IELTS-04) */}
      <section className="mx-auto max-w-7xl px-4 mt-16">
        <h2 className="font-display text-3xl font-semibold text-ink mb-2">Practice Corner</h2>
        <p className="text-sm text-ink-soft mb-6 max-w-2xl">
          {enrolled
            ? "A quick skills check — your score is saved to your progress report."
            : "A sample of our practice exercises. Enrolled students get full mock tests per skill, with scores tracked on their progress report."}
        </p>
        <PracticeQuiz enrolled={enrolled} studentUserId={studentUserId} />
      </section>
    </>
  );
}
