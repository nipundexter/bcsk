import { requireStudent } from "@/lib/auth";
import { db } from "@/lib/db";
import { SEMESTER_CURRENT } from "@/lib/constants";
import { AskForm } from "./AskForm";

/** FR-STU-07: Ask Teacher — question routed to the relevant subject teacher. */
export default async function AskTeacherPage() {
  const session = await requireStudent();
  const [enrollments, questions] = await Promise.all([
    db.enrollment.findMany({
      where: { studentUserId: session.userId, semester: SEMESTER_CURRENT, status: "ACTIVE" },
      include: { classSession: { include: { teacher: { include: { user: true } } } } },
    }),
    db.question.findMany({
      where: { studentUserId: session.userId },
      include: { teacher: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const teacherOptions = Array.from(
    new Map(
      enrollments
        .filter((e) => e.classSession.teacher)
        .map((e) => [
          e.classSession.teacher!.userId,
          { userId: e.classSession.teacher!.userId, name: e.classSession.teacher!.user.name, subject: e.classSession.title },
        ])
    ).values()
  );

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-navy mb-6">Ask Teacher</h1>
      <div className="bg-white rounded-2xl border border-line p-6 mb-8">
        <AskForm teachers={teacherOptions} />
      </div>
      <h2 className="font-display text-lg font-semibold text-ink mb-3">My Questions</h2>
      <div className="space-y-3">
        {questions.length === 0 && <p className="text-sm text-ink-soft">You haven't asked anything yet.</p>}
        {questions.map((q) => (
          <div key={q.id} className="bg-white rounded-2xl border border-line p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-bold text-ink text-sm">{q.subject}</p>
              <span className={`text-xs font-bold rounded-full px-3 py-1 ${q.answer ? "bg-teal/15 text-teal" : "bg-sunrise/15 text-sunrise-deep"}`}>
                {q.answer ? "Answered" : "Waiting"}
              </span>
            </div>
            <p className="mt-2 text-sm text-ink-soft">{q.body}</p>
            {q.answer && (
              <div className="mt-3 bg-cream rounded-lg p-3.5 text-sm text-ink">
                <p className="text-xs font-bold text-navy mb-1">{q.teacher?.name ?? "Teacher"} replied:</p>
                {q.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
