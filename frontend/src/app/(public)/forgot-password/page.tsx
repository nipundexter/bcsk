"use client";

import { useActionState } from "react";
import { forgotPassword } from "@/lib/actions/auth-actions";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(forgotPassword, null);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-cream/60">
      <div className="w-full max-w-md bg-white rounded-3xl border border-line shadow-sm p-8">
        <h1 className="font-display text-2xl font-semibold text-navy text-center">Forgot password</h1>
        {state?.ok ? (
          <p className="mt-6 text-sm text-ink-soft text-center">
            If that account has an email on file, a reset link is on its way. The link is valid for one hour.
          </p>
        ) : (
          <form action={action} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-bold text-ink">Your ID (Student / Teacher / Admin)</span>
              <input
                name="loginId"
                required
                className="mt-1.5 w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm focus:border-sky focus:outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="w-full bg-navy hover:bg-navy-deep disabled:opacity-60 text-white font-bold rounded-lg px-6 py-3 text-sm transition-colors"
            >
              {pending ? "…" : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
