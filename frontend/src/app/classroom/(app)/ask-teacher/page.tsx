import { requireStudent } from "@/lib/auth";
import { classroom } from "@/services";
import { SEMESTER_CURRENT } from "@/lib/constants";
import { AskForm } from "./AskForm";

/** FR-STU-07: Ask Teacher — question routed to the relevant subject teacher. */
export default async function AskTeacherPage() {
  const session = await requireStudent();
  const [teachers, questions] = await Promise.all([
    classroom.teachers(),
    classroom.questions(),
  ]);

  // The backend returns the directory already shaped; no de-duplication needed here.
  const teacherOptions = teachers.map((t) => ({
    userId: t.userId,
    name: t.name,
    subject: t.designation ?? t.subjects ?? "",
  }));

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
                <p className="text-xs font-bold text-navy mb-1">Teacher replied:</p>
                {q.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
