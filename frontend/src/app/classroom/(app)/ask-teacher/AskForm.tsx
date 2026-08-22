"use client";

import { useActionState } from "react";
import { askQuestion, type AskState } from "./actions";

const input = "w-full rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-sky focus:outline-none";

export function AskForm({ teachers }: { teachers: { userId: number; name: string; subject: string }[] }) {
  const [state, action, pending] = useActionState<AskState, FormData>(askQuestion, null);

  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="text-xs font-bold text-ink">Teacher</span>
        <select name="teacherUserId" required className={`mt-1.5 ${input}`}>
          <option value="">Choose your teacher…</option>
          {teachers.map((t) => (
            <option key={t.userId} value={t.userId}>
              {t.name} — {t.subject}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-bold text-ink">Subject</span>
        <input name="subject" required className={`mt-1.5 ${input}`} placeholder="e.g. Homework question about lesson 4" />
      </label>
      <label className="block">
        <span className="text-xs font-bold text-ink">Your question</span>
        <textarea name="body" required rows={3} className={`mt-1.5 ${input}`} />
      </label>
      {state?.error && <p className="text-sm text-red-600 font-semibold">{state.error}</p>}
      {state?.ok && <p className="text-sm text-teal font-semibold">Question sent — your teacher will reply here.</p>}
      <button
        disabled={pending}
        className="bg-navy hover:bg-navy-deep disabled:opacity-60 text-white text-sm font-bold rounded-lg px-6 py-2.5 transition-colors"
      >
        {pending ? "Sending…" : "Send question"}
      </button>
    </form>
  );
}
