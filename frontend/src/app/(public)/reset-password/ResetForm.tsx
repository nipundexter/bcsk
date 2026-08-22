"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPassword } from "@/lib/actions/auth-actions";

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, null);
  // Password reset is not yet exposed by the API, so the action always reports
  // unavailable rather than pretending to succeed (tracked in Phase D).
  const done = false;

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-line shadow-sm p-8">
      <h1 className="font-display text-2xl font-semibold text-navy text-center">Set a new password</h1>
      {done ? (
        <div className="mt-6 text-center">
          <p className="text-sm text-ink-soft">Your password is updated. You can log in now.</p>
          <Link href="/classroom" className="inline-block mt-4 bg-navy text-white font-bold rounded-lg px-6 py-2.5 text-sm">
            Go to login
          </Link>
        </div>
      ) : (
        <form action={action} className="mt-6 space-y-4">
          <input type="hidden" name="token" value={token} />
          <label className="block">
            <span className="text-xs font-bold text-ink">New password (min. 8 characters)</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm focus:border-sky focus:outline-none"
            />
          </label>
          {state?.error && <p className="text-sm text-red-600 font-semibold">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-navy hover:bg-navy-deep disabled:opacity-60 text-white font-bold rounded-lg px-6 py-3 text-sm transition-colors"
          >
            {pending ? "…" : "Save new password"}
          </button>
        </form>
      )}
    </div>
  );
}
