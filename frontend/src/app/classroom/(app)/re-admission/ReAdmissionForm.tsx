"use client";

import { useActionState } from "react";
import { submitReAdmission, type ReAdmitState } from "./actions";

const krw = (n: number) => `₩${n.toLocaleString("en-US")}`;

export function ReAdmissionForm({ amount, classLabel, semester }: { amount: number; classLabel: string; semester: string }) {
  const [state, action, pending] = useActionState<ReAdmitState, FormData>(submitReAdmission, null);

  if (state?.ok) {
    return (
      <div className="bg-white border border-line rounded-2xl p-6 text-sm text-ink">
        ✅ Receipt submitted. Our office verifies transfers within 1–2 working days — your enrollment renews
        automatically once verified.
      </div>
    );
  }

  return (
    <div className="bg-white border border-line rounded-2xl p-6">
      <dl className="bg-cream rounded-xl p-4 text-sm space-y-1.5 mb-5">
        <div className="flex justify-between"><dt className="font-bold text-ink-soft">Class</dt><dd className="font-bold text-ink">{classLabel}</dd></div>
        <div className="flex justify-between"><dt className="font-bold text-ink-soft">Semester</dt><dd>{semester}</dd></div>
        <div className="flex justify-between"><dt className="font-bold text-ink-soft">Semester fee</dt><dd className="font-bold text-navy">{krw(amount)}</dd></div>
        <div className="flex justify-between"><dt className="font-bold text-ink-soft">Bank</dt><dd>Hana Bank · 298-910032-72304</dd></div>
      </dl>
      <form action={action} className="space-y-4">
        <label className="block">
          <span className="text-xs font-bold text-ink">Transfer receipt (photo or PDF) *</span>
          <input
            type="file"
            name="receipt"
            required
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="mt-1.5 block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-cream file:px-4 file:py-2.5 file:text-xs file:font-bold file:text-navy"
          />
        </label>
        {state?.error && <p className="text-sm font-semibold text-red-600">{state.error}</p>}
        <button
          disabled={pending}
          className="w-full bg-sunrise hover:bg-sunrise-deep disabled:opacity-60 text-white font-bold rounded-lg px-6 py-3 text-sm transition-colors"
        >
          {pending ? "Uploading…" : `Submit re-admission (${krw(amount)})`}
        </button>
      </form>
    </div>
  );
}
