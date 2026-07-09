import Link from "next/link";
import { db } from "@/lib/db";
import { getEnrolledCourseSlugs } from "@/lib/enrollment";
import { SEMESTER_CURRENT } from "@/lib/constants";

/** 3.8.1 Arabic/Deen learning page (FR-DEEN-01..07). */
export default async function DeenPage() {
  const [course, { slugs }] = await Promise.all([
    db.course.findUnique({
      where: { slug: "deen" },
      include: {
        levels: { orderBy: { displayOrder: "asc" } },
        sessions: {
          where: { semester: SEMESTER_CURRENT, active: true },
          include: { level: true, teacher: { include: { user: true } } },
        },
      },
    }),
    getEnrolledCourseSlugs(),
  ]);
  const enrolled = slugs.has("deen") || slugs.has("hifz");

  return (
    <>
      {/* hero */}
      <section className="mx-auto max-w-7xl px-4 pt-6">
        <div className="relative bg-navy rounded-3xl px-6 sm:px-12 py-14 overflow-hidden text-white">
          <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-teal/20" aria-hidden />
          <div className="absolute right-32 bottom-6 w-20 h-20 rounded-full bg-sunrise/25" aria-hidden />
          <p className="relative text-xs font-extrabold tracking-[0.2em] uppercase text-sky-soft">Qur'an & Islamic Studies</p>
          <h1 className="relative mt-3 font-display text-4xl sm:text-5xl font-semibold max-w-2xl leading-tight">
            {course?.heroText ?? "Nurture your child's Deen"}
          </h1>
          <p className="relative mt-4 text-white/75 text-sm max-w-xl leading-relaxed">{course?.description}</p>
          <Link
            href="/apply/special?course=deen"
            className="relative inline-block mt-7 bg-sunrise hover:bg-sunrise-deep text-white font-bold rounded-lg px-7 py-3 text-sm transition-colors"
          >
            Apply for the Deen program
          </Link>
        </div>
      </section>

      {/* KOIE + programs (FR-DEEN-01/02) */}
      <section className="mx-auto max-w-7xl px-4 mt-16 grid lg:grid-cols-2 gap-10">
        <div>
          <h2 className="font-display text-3xl font-semibold text-ink">Our Programs</h2>
          <div className="mt-6 space-y-4">
            {course?.levels.map((l) => (
              <details key={l.id} className="bg-white border border-line rounded-2xl group">
                <summary className="cursor-pointer px-6 py-4 font-bold text-navy flex items-center justify-between">
                  {l.name}
                  <span className="text-sky group-open:rotate-180 transition-transform" aria-hidden>▾</span>
                </summary>
                <p className="px-6 pb-5 text-sm text-ink-soft leading-relaxed">{l.syllabus}</p>
              </details>
            ))}
          </div>
        </div>
        <div className="bg-cream rounded-3xl p-8">
          <p className="text-xs font-extrabold tracking-wide uppercase text-sunrise">KOIE</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-navy">Korea Online Islamic Education</h2>
          <p className="mt-3 text-sm text-ink leading-relaxed">
            BCSK's flagship online Islamic education program for children across Korea:
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-ink">
            {[
              "Qur'an recitation with Tajweed",
              "Basic Islamic beliefs (aqeedah)",
              "Selected Hadith of the Prophet ﷺ",
              "Stories of the Sahaba",
              "Daily duas for everyday life",
              "Islamic manners — adab & akhlaq",
            ].map((x) => (
              <li key={x} className="flex gap-2.5">
                <span className="w-2 h-2 rounded-full bg-teal mt-1.5 shrink-0" aria-hidden />
                {x}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* schedule (FR-DEEN-04) */}
      <section className="mx-auto max-w-7xl px-4 mt-16">
        <h2 className="font-display text-3xl font-semibold text-ink mb-6">Class Schedule</h2>
        <div className="overflow-x-auto rounded-2xl border border-line bg-white max-w-4xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream text-navy text-left">
                <th className="px-5 py-3.5 font-bold">Track</th>
                <th className="px-5 py-3.5 font-bold">Day</th>
                <th className="px-5 py-3.5 font-bold">Time</th>
                <th className="px-5 py-3.5 font-bold">Instructor</th>
                <th className="px-5 py-3.5 font-bold">Class</th>
              </tr>
            </thead>
            <tbody>
              {course?.sessions.map((s) => (
                <tr key={s.id} className="border-t border-line">
                  <td className="px-5 py-3.5 font-bold text-ink">{s.level?.name ?? s.title}</td>
                  <td className="px-5 py-3.5">{s.dayOfWeek}</td>
                  <td className="px-5 py-3.5">{s.startTime}{s.endTime ? `–${s.endTime}` : ""}</td>
                  <td className="px-5 py-3.5 text-ink-soft">{s.teacher?.user.name ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    {enrolled && s.zoomLink ? (
                      <a href={s.zoomLink} target="_blank" rel="noopener noreferrer" className="text-white bg-teal hover:bg-teal/85 text-xs font-bold rounded-lg px-3 py-1.5 transition-colors">
                        Join Zoom
                      </a>
                    ) : (
                      <Link href="/classroom" className="text-xs font-bold text-sky hover:underline">
                        Enrolled students
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* resources (FR-DEEN-05) + Hifz note (FR-DEEN-06) */}
      <section className="mx-auto max-w-7xl px-4 mt-16 grid md:grid-cols-2 gap-6 max-w-4xl">
        <div className="bg-white border border-line rounded-2xl p-7">
          <h2 className="font-display text-xl font-semibold text-navy">Learning Resources</h2>
          <p className="mt-2 text-sm text-ink-soft leading-relaxed">
            Recitation audio, Tajweed guides, and printable dua sheets are provided to enrolled students inside the
            Classroom portal. Premium resources are unlocked after enrollment.
          </p>
          <Link href={enrolled ? "/classroom/syllabus" : "/classroom"} className="inline-block mt-4 text-sky text-sm font-bold hover:underline">
            {enrolled ? "Open my resources →" : "Log in to access →"}
          </Link>
        </div>
        <div className="bg-white border border-line rounded-2xl p-7">
          <h2 className="font-display text-xl font-semibold text-navy">Hifz Progress Tracking</h2>
          <p className="mt-2 text-sm text-ink-soft leading-relaxed">
            Every Hifz student's memorization is tracked surah-by-surah and juz-by-juz. Students and guardians can
            follow progress on the Classroom dashboard; teachers update it after each session.
          </p>
          <Link href={enrolled ? "/classroom/results" : "/apply/special?course=hifz"} className="inline-block mt-4 text-sky text-sm font-bold hover:underline">
            {enrolled ? "See my Hifz progress →" : "Join the Hifz program →"}
          </Link>
        </div>
      </section>

      {/* CTA (FR-DEEN-07) */}
      <section className="mx-auto max-w-7xl px-4 mt-16">
        <div className="bg-cream rounded-3xl px-6 sm:px-12 py-10 text-center max-w-4xl mx-auto">
          <h2 className="font-display text-2xl font-semibold text-navy">Ready to begin?</h2>
          <p className="mt-2 text-sm text-ink-soft">Apply for Qur'an & Islamic Studies, or the Hifz program — boys', girls', and ladies' tracks available.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/apply/special?course=deen" className="bg-sunrise hover:bg-sunrise-deep text-white font-bold rounded-lg px-6 py-2.5 text-sm transition-colors">
              Apply — Qur'an & Deen
            </Link>
            <Link href="/apply/special?course=hifz" className="bg-navy hover:bg-navy-deep text-white font-bold rounded-lg px-6 py-2.5 text-sm transition-colors">
              Apply — Hifz Program
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
