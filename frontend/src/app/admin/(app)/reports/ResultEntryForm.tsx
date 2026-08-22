"use client";

import { useActionState } from "react";
import { addExamResult, type ResultState } from "./actions";

const input = "rounded-lg border border-line px-3 py-2 text-sm focus:border-sky focus:outline-none";

export function ResultEntryForm({ students }: { students: { userId: number; label: string }[] }) {
  const [state, action, pending] = useActionState<ResultState, FormData>(addExamResult, null);

  return (
    <details className="bg-white rounded-2xl border border-line">
      <summary className="cursor-pointer px-5 py-3.5 font-bold text-navy text-sm">+ Enter exam result</summary>
      <form action={action} className="px-5 pb-5 flex flex-wrap gap-3 items-end">
        <label className="block text-xs font-bold text-ink">
          Student
          <select name="studentUserId" required className={`block mt-1 ${input}`}>
            {students.map((s) => <option key={s.userId} value={s.userId}>{s.label}</option>)}
          </select>
        </label>
        <label className="block text-xs font-bold text-ink">
          Semester
          <input name="semester" required defaultValue="2026-2" className={`block mt-1 w-24 ${input}`} />
        </label>
        <label className="block text-xs font-bold text-ink">
          Subject
          <input name="subject" required placeholder="e.g. Bangla" className={`block mt-1 ${input}`} />
        </label>
        <label className="block text-xs font-bold text-ink">
          Marks
          <input name="marks" type="number" required className={`block mt-1 w-20 ${input}`} />
        </label>
        <label className="block text-xs font-bold text-ink">
          Full marks
          <input name="fullMarks" type="number" defaultValue={100} className={`block mt-1 w-20 ${input}`} />
        </label>
        <label className="block text-xs font-bold text-ink">
          Grade
          <input name="grade" placeholder="A+" className={`block mt-1 w-16 ${input}`} />
        </label>
        <button disabled={pending} className="bg-navy hover:bg-navy-deep disabled:opacity-60 text-white text-xs font-bold rounded-lg px-5 py-2.5 transition-colors">
          {pending ? "Saving…" : "Save result"}
        </button>
        {state?.error && <p className="w-full text-xs font-semibold text-red-600">{state.error}</p>}
        {state?.ok && <p className="w-full text-xs font-semibold text-teal">Result saved ✓ (appears on the student's Results page)</p>}
      </form>
    </details>
  );
}
