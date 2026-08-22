import { formatDate } from "@/lib/dates";
import { requireStudent } from "@/lib/auth";
import { classroom } from "@/services";
import { SEMESTER_CURRENT } from "@/lib/constants";
import { SubmitForm } from "./SubmitForm";

/** FR-STU-05 / UC-3: assignments & homework — view, download, submit, see grades. */
export default async function AssignmentsPage() {
  const session = await requireStudent();
  // The backend scopes this to the caller, so no student id is passed or trusted.
  const assignments = await classroom.assignments();

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-navy mb-6">Assignment & Homework</h1>
      <div className="space-y-4">
        {assignments.length === 0 && (
          <p className="bg-white rounded-2xl border border-line p-6 text-sm text-ink-soft">No assignments yet.</p>
        )}
        {assignments.map((a) => {
          const sub = a.submissions[0];
          const overdue = a.dueDate && new Date(a.dueDate) < new Date() && !sub;
          return (
            <div key={a.id} className="bg-white rounded-2xl border border-line p-6">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-sky">{a.classSession.title}</p>
                  <h2 className="mt-1 font-bold text-ink">{a.title}</h2>
                </div>
                {a.dueDate && (
                  <span className={`text-xs font-bold rounded-full px-3 py-1 ${overdue ? "bg-red-50 text-red-600" : "bg-cream text-navy"}`}>
                    Due {formatDate(a.dueDate)}
                  </span>
                )}
              </div>
              {a.description && <p className="mt-2 text-sm text-ink-soft">{a.description}</p>}
              {a.fileUrl && (
                <a href={`/api/files/${a.fileUrl}`} className="inline-block mt-3 text-sky text-sm font-bold hover:underline">
                  Download task file
                </a>
              )}
              <div className="mt-4 border-t border-line pt-4">
                {sub ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold text-white bg-teal rounded-full px-3 py-1">Submitted</span>
                    <span className="text-xs text-ink-soft">
                      {formatDate(sub.submittedAt)}
                    </span>
                    {sub.grade ? (
                      <span className="text-xs font-bold text-navy bg-sky-soft rounded-full px-3 py-1">Grade: {sub.grade}</span>
                    ) : (
                      <span className="text-xs text-ink-soft">Awaiting grade</span>
                    )}
                    {sub.feedback && <p className="w-full text-xs text-ink bg-cream rounded-lg p-3 mt-1">Teacher: {sub.feedback}</p>}
                  </div>
                ) : (
                  <SubmitForm assignmentId={a.id} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
