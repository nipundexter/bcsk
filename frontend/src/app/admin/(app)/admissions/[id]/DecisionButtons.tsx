"use client";

import { useState, useTransition } from "react";
import { approveApplication, rejectApplication, requestCorrections, type DecisionResult } from "./actions";

export function DecisionButtons({ applicationId, status }: { applicationId: number; status: string }) {
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"none" | "reject" | "corrections">("none");
  // The API can refuse a decision (already decided, missing payment record). Show it
  // instead of letting the click appear to do nothing.
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<DecisionResult>) =>
    start(async () => setError((await fn()).error ?? null));

  if (["APPROVED", "REJECTED"].includes(status)) {
    return <p className="text-sm text-ink-soft">Decision recorded. {status === "APPROVED" ? "Student account is active." : ""}</p>;
  }

  return (
    <div className="bg-white rounded-2xl border border-line p-6">
      <h2 className="font-display text-lg font-semibold text-navy mb-4">Decision</h2>
      <div className="flex flex-wrap gap-3">
        <button
          disabled={pending}
          onClick={() => run(() => approveApplication(applicationId))}
          className="bg-teal hover:bg-teal/85 disabled:opacity-60 text-white text-sm font-bold rounded-lg px-6 py-2.5 transition-colors"
        >
          ✓ Approve
        </button>
        <button
          onClick={() => setMode(mode === "corrections" ? "none" : "corrections")}
          className="border-2 border-line hover:border-sky text-navy text-sm font-bold rounded-lg px-6 py-2.5 transition-colors"
        >
          Request corrections…
        </button>
        <button
          onClick={() => setMode(mode === "reject" ? "none" : "reject")}
          className="border-2 border-red-200 text-red-600 hover:bg-red-50 text-sm font-bold rounded-lg px-6 py-2.5 transition-colors"
        >
          Reject…
        </button>
      </div>
      {mode === "corrections" && (
        <form action={(fd) => run(() => requestCorrections(applicationId, fd))} className="mt-4 flex gap-2">
          <input
            name="note"
            required
            placeholder="What needs to be corrected? (emailed to the guardian)"
            className="flex-1 rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-sky focus:outline-none"
          />
          <button disabled={pending} className="bg-navy text-white text-sm font-bold rounded-lg px-5 py-2.5">Send</button>
        </form>
      )}
      {mode === "reject" && (
        <form action={(fd) => run(() => rejectApplication(applicationId, fd))} className="mt-4 flex gap-2">
          <input
            name="reason"
            placeholder="Reason (emailed to the guardian)"
            className="flex-1 rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-sky focus:outline-none"
          />
          <button disabled={pending} className="bg-red-600 text-white text-sm font-bold rounded-lg px-5 py-2.5">Confirm rejection</button>
        </form>
      )}
      {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
      <p className="mt-3 text-xs text-ink-soft">
        Approving with a confirmed payment creates the student account and emails the Classroom credentials automatically (UC-2).
      </p>
    </div>
  );
}
