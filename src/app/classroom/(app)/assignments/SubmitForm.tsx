"use client";

import { useActionState } from "react";
import { submitAssignment, type SubmitState } from "./actions";

export function SubmitForm({ assignmentId }: { assignmentId: number }) {
  const [state, action, pending] = useActionState<SubmitState, FormData>(submitAssignment, null);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <textarea
        name="text"
        rows={2}
        placeholder="Write your answer (optional if uploading a file)…"
        className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-sky focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          name="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          className="text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-cream file:px-3 file:py-2 file:text-xs file:font-bold file:text-navy"
        />
        <button
          disabled={pending}
          className="bg-navy hover:bg-navy-deep disabled:opacity-60 text-white text-xs font-bold rounded-lg px-5 py-2.5 transition-colors"
        >
          {pending ? "Submitting…" : "Submit homework"}
        </button>
      </div>
      {state?.error && <p className="text-xs text-red-600 font-semibold">{state.error}</p>}
    </form>
  );
}
