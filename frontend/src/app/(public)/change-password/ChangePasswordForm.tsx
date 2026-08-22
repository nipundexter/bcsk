"use client";

import { useActionState } from "react";
import { changePassword, type ChangePasswordState } from "@/lib/actions/auth-actions";

const input =
  "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm focus:border-sky focus:outline-none";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<ChangePasswordState, FormData>(
    changePassword,
    null
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-xs font-bold text-ink">Current password</span>
        <input
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className={`mt-1.5 ${input}`}
        />
      </label>
      <label className="block">
        <span className="text-xs font-bold text-ink">New password</span>
        <input
          name="newPassword"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          className={`mt-1.5 ${input}`}
        />
        <span className="mt-1 block text-[11px] text-ink-soft">At least 10 characters.</span>
      </label>
      <label className="block">
        <span className="text-xs font-bold text-ink">Confirm new password</span>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          className={`mt-1.5 ${input}`}
        />
      </label>
      {state?.error && <p className="text-sm text-red-600 font-semibold">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-navy hover:bg-navy-deep disabled:opacity-60 text-white font-bold rounded-lg px-6 py-3 text-sm transition-colors"
      >
        {pending ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}
