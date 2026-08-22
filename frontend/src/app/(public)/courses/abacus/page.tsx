import Link from "next/link";
import { site } from "@/services";
import { getSession } from "@/lib/auth";
import { SEMESTER_CURRENT } from "@/lib/constants";
import { VirtualAbacus } from "./VirtualAbacus";
import { FunAbacus } from "./FunAbacus";

const ABOUT_SECTIONS = [
  {
    title: "What is an Abacus?",
    body: "The abacus is one of humanity's oldest calculating tools — a frame of rods and beads used for arithmetic for over 2,500 years. The Japanese soroban style we teach has one 'heaven' bead (worth 5) and four 'earth' beads (worth 1 each) per rod.",
  },
  {
    title: "What is Mental Arithmetic?",
    body: "After enough abacus practice, children stop needing the physical tool — they visualize the beads and move them in their mind (anzan). This mental abacus lets them add, subtract, multiply, and divide large numbers faster than a calculator.",
  },
  {
    title: "History of the Abacus",
    body: "From the Sumerian dust boards to the Roman calculi, the Chinese suanpan and the Japanese soroban — the abacus has traveled every trade route in history. It remains the world's most successful calculating device.",
  },
  {
    title: "Why Abacus?",
    body: "Abacus training develops concentration, memory, visualization, speed, and confidence with numbers. Studies link early abacus learning with stronger number sense and working memory — and children find it genuinely fun.",
  },
  {
    title: "Calculation Techniques",
    body: "Students progress through finger technique, small friends (pairs that make 5), big friends (pairs that make 10), then multi-digit addition, subtraction, multiplication, and division — finishing with pure mental anzan.",
  },
  {
    title: "Parts of the Abacus",
    body: "Frame, beam (the horizontal bar), rods, one heaven bead above the beam worth 5, and four earth beads below worth 1 each. A bead counts when moved toward the beam.",
  },
];

/** 3.8.3 Abacus learning page (FR-ABC-01..09). */
export default async function AbacusPage() {
  const [course, slugs, session] = await Promise.all([
    site.course("abacus"),
    site.enrolledCourseSlugs(),
    getSession(),
  ]);
  const enrolled = slugs.includes("abacus");
  const studentUserId = session?.role === "STUDENT" ? session.userId : null;

  const nav = [
    ["#about", "All About Abacus"],
    ["#syllabus", "Syllabus"],
    ["#books", "Books"],
    ["#online-class", "Online Class"],
    ["#virtual-abacus", "Virtual Abacus"],
    ["#fun-abacus", "Fun Abacus"],
  ] as const;

  return (
    <>
      {/* hero + subnav (FR-ABC-01) */}
      <section className="mx-auto max-w-7xl px-4 pt-6">
        <div className="relative bg-cream rounded-3xl px-6 sm:px-12 py-14 overflow-hidden">
          <div className="absolute right-10 top-8 hidden lg:flex gap-2" aria-hidden>
            {["bg-sunrise", "bg-sky", "bg-teal", "bg-navy"].map((c, i) => (
              <div key={i} className="flex flex-col gap-2">
                {Array.from({ length: 4 - (i % 2) }).map((_, j) => (
                  <span key={j} className={`w-6 h-6 rounded-full ${c}`} />
                ))}
              </div>
            ))}
          </div>
          <p className="text-xs font-extrabold tracking-[0.2em] uppercase text-sunrise">BCSK Abacus Programme</p>
          <h1 className="relative mt-3 font-display text-4xl sm:text-5xl font-semibold text-ink max-w-xl leading-tight">
            Where Math Becomes an Adventure
          </h1>
          <p className="relative mt-4 text-ink-soft text-sm max-w-xl leading-relaxed">{course?.description}</p>
          <Link
            href="/apply/special?course=abacus"
            className="relative inline-block mt-7 bg-sunrise hover:bg-sunrise-deep text-white font-bold rounded-lg px-7 py-3 text-sm transition-colors"
          >
            Join the Abacus programme
          </Link>
        </div>
        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Abacus sections">
          {nav.map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="whitespace-nowrap text-xs font-bold bg-white border border-line hover:border-sky text-navy rounded-full px-4 py-2 transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>
      </section>

      {/* all about (FR-ABC-02) */}
      <section id="about" className="mx-auto max-w-7xl px-4 mt-16 scroll-mt-24">
        <h2 className="font-display text-3xl font-semibold text-ink mb-6">All About Abacus</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ABOUT_SECTIONS.map((s) => (
            <div key={s.title} className="bg-white border border-line rounded-2xl p-6">
              <h3 className="font-display text-lg font-semibold text-navy">{s.title}</h3>
              <p className="mt-2 text-sm text-ink-soft leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* syllabus (FR-ABC-03) */}
      <section id="syllabus" className="mx-auto max-w-7xl px-4 mt-16 scroll-mt-24">
        <h2 className="font-display text-3xl font-semibold text-ink mb-6">Syllabus — Level 0 to Level 7</h2>
        <div className="max-w-3xl space-y-3">
          {course?.levels.map((l, i) => (
            <details key={l.id} className="bg-white border border-line rounded-2xl group">
              <summary className="cursor-pointer px-6 py-4 font-bold text-navy flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full text-white text-sm flex items-center justify-center ${["bg-sunrise", "bg-sky", "bg-teal", "bg-navy"][i % 4]}`}>
                  {i}
                </span>
                {l.name}
                <span className="ml-auto text-sky group-open:rotate-180 transition-transform" aria-hidden>▾</span>
              </summary>
              <p className="px-6 pb-5 text-sm text-ink-soft leading-relaxed">{l.syllabus}</p>
            </details>
          ))}
        </div>
      </section>

      {/* books (FR-ABC-04) */}
      <section id="books" className="mx-auto max-w-7xl px-4 mt-16 scroll-mt-24">
        <h2 className="font-display text-3xl font-semibold text-ink mb-2">Books</h2>
        <p className="text-sm text-ink-soft mb-6 max-w-2xl">
          Each level has a Student Book and a Work Book.{" "}
          {enrolled ? "Download yours below." : "Enrolled students can download the PDFs; guests see the list only."}
        </p>
        <div className="overflow-x-auto rounded-2xl border border-line bg-white max-w-3xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream text-navy text-left">
                <th className="px-5 py-3.5 font-bold">Level</th>
                <th className="px-5 py-3.5 font-bold">Student Book</th>
                <th className="px-5 py-3.5 font-bold">Work Book</th>
              </tr>
            </thead>
            <tbody>
              {course?.levels.map((l) => (
                <tr key={l.id} className="border-t border-line">
                  <td className="px-5 py-3.5 font-bold text-ink">{l.name}</td>
                  {[l.studentBookUrl, l.workBookUrl].map((url, j) => (
                    <td key={j} className="px-5 py-3.5">
                      {url && enrolled ? (
                        <a href={`/api/files/${url}`} className="text-sky font-bold hover:underline">Download PDF</a>
                      ) : url ? (
                        <span className="text-ink-soft">Enrolled students only</span>
                      ) : (
                        <span className="text-ink-soft">In preparation</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* online class grid (FR-ABC-05) */}
      <section id="online-class" className="mx-auto max-w-7xl px-4 mt-16 scroll-mt-24">
        <h2 className="font-display text-3xl font-semibold text-ink mb-6">Online Class</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {course?.sessions.map((s) => (
            <div key={s.id} className="bg-white border border-line rounded-2xl p-5">
              <p className="text-xs font-extrabold uppercase tracking-wide text-sky">{s.level?.name}</p>
              <h3 className="mt-1 font-bold text-navy">{s.title.replace(/^Abacus /, "")}</h3>
              <p className="mt-1.5 text-xs text-ink-soft">
                {s.dayOfWeek} · {s.startTime}{s.endTime ? `–${s.endTime}` : ""}
                {s.teacher ? <><br />{s.teacher.user.name}</> : null}
              </p>
              {enrolled && s.zoomLink ? (
                <a href={s.zoomLink} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 bg-teal hover:bg-teal/85 text-white text-xs font-bold rounded-lg px-4 py-2 transition-colors">
                  Join class
                </a>
              ) : (
                <Link href="/classroom" className="inline-block mt-3 text-xs font-bold text-sky hover:underline">
                  Enrolled students →
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* virtual abacus (FR-ABC-06) */}
      <section id="virtual-abacus" className="mx-auto max-w-7xl px-4 mt-16 scroll-mt-24">
        <h2 className="font-display text-3xl font-semibold text-ink mb-2">Virtual Abacus</h2>
        <p className="text-sm text-ink-soft mb-6 max-w-2xl">
          A real soroban in your browser — click beads toward the beam to count them. Heaven beads are worth 5,
          earth beads 1. Try making today's date!
        </p>
        <VirtualAbacus />
      </section>

      {/* fun abacus (FR-ABC-07/08) */}
      <section id="fun-abacus" className="mx-auto max-w-7xl px-4 mt-16 scroll-mt-24">
        <h2 className="font-display text-3xl font-semibold text-ink mb-2">Fun Abacus</h2>
        <p className="text-sm text-ink-soft mb-6 max-w-2xl">
          Timed arithmetic challenges to sharpen your anzan.{" "}
          {studentUserId ? "Your scores are saved to your progress report." : "Log in as a student to save your scores."}
        </p>
        <FunAbacus loggedIn={!!studentUserId} />
      </section>

      {/* CTA (FR-ABC-09) */}
      <section className="mx-auto max-w-7xl px-4 mt-16">
        <div className="bg-navy rounded-3xl px-6 sm:px-12 py-12 text-center">
          <h2 className="font-display text-3xl font-semibold text-white">Ready for the adventure?</h2>
          <p className="mt-2 text-white/70 text-sm">Eight levels from first beads to full mental arithmetic.</p>
          <Link
            href="/apply/special?course=abacus"
            className="inline-block mt-6 bg-sunrise hover:bg-sunrise-deep text-white font-bold rounded-lg px-8 py-3 text-sm transition-colors"
          >
            Apply for Abacus
          </Link>
        </div>
      </section>
    </>
  );
}
