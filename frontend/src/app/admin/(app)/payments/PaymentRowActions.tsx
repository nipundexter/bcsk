"use client";

import { useState, useTransition } from "react";
import { verifyPayment, rejectPayment, refundPayment } from "./actions";

export function PaymentRowActions({ paymentId, status }: { paymentId: number; status: string }) {
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"none" | "reject" | "refund">("none");
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ error?: string }>) =>
    start(async () => setError((await fn()).error ?? null));

  if (status === "PENDING_VERIFICATION") {
    return (
      <div className="space-y-1.5">
        <button
          disabled={pending}
          onClick={() => run(() => verifyPayment(paymentId))}
          className="block w-full bg-teal hover:bg-teal/85 disabled:opacity-60 text-white text-[11px] font-bold rounded-lg px-3 py-1.5 transition-colors"
        >
          ✓ Verify
        </button>
        {mode === "reject" ? (
          <form action={(fd) => run(() => rejectPayment(paymentId, fd))} className="space-y-1">
            <input name="reason" placeholder="Reason" className="w-full rounded border border-line px-2 py-1 text-[11px]" />
            <button disabled={pending} className="w-full bg-red-600 text-white text-[11px] font-bold rounded px-2 py-1">Confirm reject</button>
          </form>
        ) : (
          <button
            onClick={() => setMode("reject")}
            className="block w-full border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-bold rounded-lg px-3 py-1.5 transition-colors"
          >
            ✕ Reject
          </button>
        )}
        {error && <p className="text-[10px] font-semibold text-red-600">{error}</p>}
      </div>
    );
  }
  if (["PAID", "VERIFIED"].includes(status)) {
    return (
      <div className="space-y-1.5">
        {mode === "refund" ? (
          <form action={(fd) => run(() => refundPayment(paymentId, fd))} className="space-y-1">
            <input name="reason" placeholder="Refund reason" className="w-full rounded border border-line px-2 py-1 text-[11px]" />
            <button disabled={pending} className="w-full bg-sky text-white text-[11px] font-bold rounded px-2 py-1">Confirm refund</button>
          </form>
        ) : (
          <button
            onClick={() => setMode("refund")}
            className="border border-line text-ink-soft hover:text-navy text-[11px] font-bold rounded-lg px-3 py-1.5 transition-colors"
          >
            Refund…
          </button>
        )}
        {error && <p className="text-[10px] font-semibold text-red-600">{error}</p>}
      </div>
    );
  }
  return <span className="text-xs text-ink-soft">—</span>;
}
