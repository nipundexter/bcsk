"use client";

import { useActionState } from "react";
import { answerQuestion, type AnswerState } from "./actions";

export function AnswerForm({ questionId, existing }: { questionId: number; existing: string | null }) {
  const [state, action, pending] = useActionState<AnswerState, FormData>(answerQuestion, null);

  return (
    <form action={action} className="flex flex-wrap gap-3 items-start">
      <input type="hidden" name="questionId" value={questionId} />
      <textarea
        name="answer"
        rows={2}
        defaultValue={existing ?? ""}
        placeholder="Write your reply…"
        className="flex-1 min-w-56 rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-sky focus:outline-none"
      />
      <button
        disabled={pending}
        className="bg-navy hover:bg-navy-deep disabled:opacity-60 text-white text-xs font-bold rounded-lg px-5 py-2.5 transition-colors"
      >
        {pending ? "Sending…" : existing ? "Update reply" : "Reply"}
      </button>
      {state?.error && <p className="w-full text-xs font-semibold text-red-600">{state.error}</p>}
      {state?.ok && <p className="w-full text-xs font-semibold text-teal">Reply sent — the student was notified.</p>}
    </form>
  );
}
