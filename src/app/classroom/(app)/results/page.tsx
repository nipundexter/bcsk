import { requireStudent } from "@/lib/auth";
import { db } from "@/lib/db";

/** FR-STU-05 / FR-IELTS-05 / FR-ABC-08: result sheet, progress records, Hifz progress, game scores. */
export default async function ResultsPage() {
  const session = await requireStudent();
  const [results, progress, hifz, games] = await Promise.all([
    db.examResult.findMany({ where: { studentUserId: session.userId }, orderBy: [{ semester: "desc" }, { subject: "asc" }] }),
    db.progressRecord.findMany({ where: { studentUserId: session.userId }, orderBy: { recordedAt: "desc" } }),
    db.hifzProgress.findMany({ where: { studentUserId: session.userId }, orderBy: { surahNumber: "desc" } }),
    db.gameScore.findMany({ where: { studentUserId: session.userId }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  const semesters = Array.from(new Set(results.map((r) => r.semester)));

  return (
    <div className="max-w-3xl space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-navy">Progress Report & Results</h1>
        <a
          href="/api/documents/result-sheet"
          className="text-xs font-bold text-white bg-navy hover:bg-navy-deep rounded-lg px-4 py-2 transition-colors"
        >
          Download Result Sheet
        </a>
      </div>

      {semesters.map((sem) => (
        <section key={sem}>
          <h2 className="font-display text-lg font-semibold text-ink mb-3">Semester {sem}</h2>
          <div className="overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream text-navy text-left">
                  <th className="px-5 py-3.5 font-bold">Subject</th>
                  <th className="px-5 py-3.5 font-bold">Marks</th>
                  <th className="px-5 py-3.5 font-bold">Grade</th>
                  <th className="px-5 py-3.5 font-bold">Remark</th>
                </tr>
              </thead>
              <tbody>
                {results.filter((r) => r.semester === sem).map((r) => (
                  <tr key={r.id} className="border-t border-line">
                    <td className="px-5 py-3 font-bold text-ink">{r.subject}</td>
                    <td className="px-5 py-3">{r.marks} / {r.fullMarks}</td>
                    <td className="px-5 py-3"><span className="font-bold text-navy">{r.grade ?? "—"}</span></td>
                    <td className="px-5 py-3 text-ink-soft">{r.remark ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      {semesters.length === 0 && (
        <p className="bg-white rounded-2xl border border-line p-6 text-sm text-ink-soft">No exam results published yet.</p>
      )}

      {progress.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold text-ink mb-3">Course Progress (IELTS / Abacus / Special)</h2>
          <div className="space-y-2">
            {progress.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-line px-5 py-3 flex flex-wrap items-center gap-3 text-sm">
                <span className="text-xs font-bold uppercase tracking-wide text-sky">{p.courseSlug}</span>
                <span className="font-bold text-ink">{p.label}</span>
                <span className="ml-auto font-display text-lg font-semibold text-navy">{p.score}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {hifz.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold text-ink mb-3">Hifz Progress (FR-DEEN-06)</h2>
          <div className="bg-white rounded-2xl border border-line p-5">
            <p className="text-sm text-ink-soft mb-3">{hifz.length} of 114 surahs completed</p>
            <div className="h-3 rounded-full bg-cream overflow-hidden">
              <div className="h-full bg-teal rounded-full" style={{ width: `${Math.round((hifz.length / 114) * 100)}%` }} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {hifz.map((h) => (
                <span key={h.id} className="text-xs font-bold bg-teal/10 text-teal rounded-full px-3 py-1">
                  {h.surahNumber}. {h.surahName}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {games.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold text-ink mb-3">Fun Abacus Scores (FR-ABC-08)</h2>
          <div className="space-y-2">
            {games.map((g) => (
              <div key={g.id} className="bg-white rounded-xl border border-line px-5 py-3 flex items-center gap-3 text-sm">
                <span className="font-bold text-ink capitalize">{g.game.replace(/-/g, " ")}</span>
                <span className="text-xs text-ink-soft">Level {g.level}</span>
                <span className="ml-auto font-display text-lg font-semibold text-sunrise">{g.score} pts</span>
                <time className="text-xs text-ink-soft">{g.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
