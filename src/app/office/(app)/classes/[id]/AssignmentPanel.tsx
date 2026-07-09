"use client";

import { useActionState, useState } from "react";
import { postAssignment, gradeSubmission, type TeacherFormState } from "./actions";

const input = "w-full rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-sky focus:outline-none";

type Sub = {
  id: number;
  studentName: string;
  studentCode: string;
  text: string | null;
  fileUrl: string | null;
  grade: string | null;
  feedback: string | null;
  submittedAt: string;
};
type A = { id: number; title: string; dueDate: string | null; submissions: Sub[] };

export function AssignmentPanel({
  classSessionId,
  assignments,
  enrolledCount,
}: {
  classSessionId: number;
  assignments: A[];
  enrolledCount: number;
}) {
  const [postState, postAction, posting] = useActionState<TeacherFormState, FormData>(postAssignment, null);
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="bg-white rounded-2xl border border-line p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-navy">Assignments & Homework</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-sunrise hover:bg-sunrise-deep text-white text-xs font-bold rounded-lg px-4 py-2 transition-colors"
        >
          {showForm ? "Close" : "+ Post assignment"}
        </button>
      </div>

      {showForm && (
        <form action={postAction} className="bg-cream rounded-xl p-4 space-y-3 mb-6">
          <input type="hidden" name="classSessionId" value={classSessionId} />
          <input name="title" required placeholder="Assignment title" className={input} />
          <textarea name="description" rows={2} placeholder="Instructions…" className={input} />
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-bold text-ink">
              Due:{" "}
              <input name="dueDate" type="date" className="rounded-lg border border-line px-2.5 py-2 text-xs" />
            </label>
            <input
              type="file"
              name="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              className="text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-bold file:text-navy"
            />
            <button
              disabled={posting}
              className="ml-auto bg-navy hover:bg-navy-deep disabled:opacity-60 text-white text-xs font-bold rounded-lg px-5 py-2.5 transition-colors"
            >
              {posting ? "Posting…" : "Post to class"}
            </button>
          </div>
          {postState?.error && <p className="text-xs font-semibold text-red-600">{postState.error}</p>}
          {postState?.ok && <p className="text-xs font-semibold text-teal">Posted — students were notified.</p>}
        </form>
      )}

      <div className="space-y-4">
        {assignments.length === 0 && <p className="text-sm text-ink-soft">No assignments posted yet.</p>}
        {assignments.map((a) => (
          <details key={a.id} className="border border-line rounded-xl">
            <summary className="cursor-pointer px-5 py-3.5 flex flex-wrap items-center gap-3">
              <span className="font-bold text-ink text-sm">{a.title}</span>
              {a.dueDate && <span className="text-xs text-ink-soft">due {a.dueDate}</span>}
              <span className="ml-auto text-xs font-bold text-sky">
                {a.submissions.length}/{enrolledCount} submitted
              </span>
            </summary>
            <div className="px-5 pb-4 divide-y divide-line">
              {a.submissions.length === 0 && <p className="text-xs text-ink-soft py-3">No submissions yet.</p>}
              {a.submissions.map((s) => (
                <SubmissionRow key={s.id} sub={s} />
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function SubmissionRow({ sub }: { sub: Sub }) {
  const [state, action, pending] = useActionState<TeacherFormState, FormData>(gradeSubmission, null);
  return (
    <div className="py-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-bold text-ink">{sub.studentName}</span>
        <span className="text-[11px] text-ink-soft">{sub.studentCode} · {sub.submittedAt}</span>
        {sub.fileUrl && (
          <a href={`/api/files/${sub.fileUrl}`} target="_blank" className="text-sky text-xs font-bold hover:underline">
            View file
          </a>
        )}
      </div>
      {sub.text && <p className="mt-1.5 text-xs text-ink bg-cream rounded-lg p-3">{sub.text}</p>}
      <form action={action} className="mt-2 flex flex-wrap items-center gap-2">
        <input type="hidden" name="submissionId" value={sub.id} />
        <input
          name="grade"
          defaultValue={sub.grade ?? ""}
          placeholder="Grade (e.g. A+, 90)"
          className="rounded-lg border border-line px-3 py-1.5 text-xs w-32 focus:border-sky focus:outline-none"
        />
        <input
          name="feedback"
          defaultValue={sub.feedback ?? ""}
          placeholder="Feedback (optional)"
          className="rounded-lg border border-line px-3 py-1.5 text-xs flex-1 min-w-40 focus:border-sky focus:outline-none"
        />
        <button
          disabled={pending}
          className="bg-teal hover:bg-teal/85 disabled:opacity-60 text-white text-xs font-bold rounded-lg px-4 py-1.5 transition-colors"
        >
          {sub.grade ? "Update" : "Grade"}
        </button>
        {state?.error && <span className="text-xs text-red-600 font-semibold">{state.error}</span>}
        {state?.ok && <span className="text-xs text-teal font-semibold">✓</span>}
      </form>
    </div>
  );
}
