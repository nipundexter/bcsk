import { requireTeacher } from "@/lib/auth";
import { db } from "@/lib/db";
import { AnswerForm } from "./AnswerForm";

/** FR-STU-07 (teacher side) / FR-TCH-05: answer student questions. */
export default async function QuestionsPage() {
  const session = await requireTeacher();
  const questions = await db.question.findMany({
    where: { teacherUserId: session.userId },
    include: { student: { include: { studentProfile: true } } },
    orderBy: [{ answeredAt: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-navy mb-6">Student Questions</h1>
      <div className="space-y-4">
        {questions.length === 0 && (
          <p className="bg-white rounded-2xl border border-line p-6 text-sm text-ink-soft">No questions yet.</p>
        )}
        {questions.map((q) => (
          <div key={q.id} className="bg-white rounded-2xl border border-line p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-ink text-sm">{q.subject}</span>
              <span className="text-xs text-ink-soft">
                — {q.student.name} ({q.student.studentProfile?.studentId}) ·{" "}
                {q.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
              <span className={`ml-auto text-xs font-bold rounded-full px-3 py-1 ${q.answer ? "bg-teal/15 text-teal" : "bg-sunrise/15 text-sunrise-deep"}`}>
                {q.answer ? "Answered" : "Waiting"}
              </span>
            </div>
            <p className="mt-2 text-sm text-ink-soft">{q.body}</p>
            <div className="mt-4 border-t border-line pt-4">
              <AnswerForm questionId={q.id} existing={q.answer} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
