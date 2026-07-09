"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { LoginState } from "@/lib/actions/auth-actions";

const input =
  "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm focus:border-sky focus:outline-none";

export function LoginCard({
  title,
  idLabel,
  passwordLabel,
  loginLabel,
  forgotLabel,
  requestIdLabel,
  invalidMessage,
  action,
  accent = "bg-navy hover:bg-navy-deep",
  demoHint,
}: {
  title: string;
  idLabel: string;
  passwordLabel: string;
  loginLabel: string;
  forgotLabel: string;
  requestIdLabel?: string;
  invalidMessage: string;
  action: (prev: LoginState, f: FormData) => Promise<LoginState>;
  accent?: string;
  demoHint?: string;
}) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(action, null);

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-line shadow-sm p-8">
      <h1 className="font-display text-2xl font-semibold text-navy text-center">{title}</h1>
      <form action={formAction} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-xs font-bold text-ink">{idLabel}</span>
          <input name="loginId" required autoComplete="username" className={`mt-1.5 ${input}`} />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-ink">{passwordLabel}</span>
          <input name="password" type="password" required autoComplete="current-password" className={`mt-1.5 ${input}`} />
        </label>
        {state?.error && (
          <p className="text-sm text-red-600 font-semibold">{state.error === "invalid" ? invalidMessage : state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className={`w-full ${accent} disabled:opacity-60 text-white font-bold rounded-lg px-6 py-3 text-sm transition-colors`}
        >
          {pending ? "…" : loginLabel}
        </button>
      </form>
      <div className="mt-5 flex items-center justify-between text-xs">
        <Link href="/forgot-password" className="text-sky font-bold hover:underline">
          {forgotLabel}
        </Link>
        {requestIdLabel && (
          <Link href="/apply" className="text-sky font-bold hover:underline">
            {requestIdLabel}
          </Link>
        )}
      </div>
      {demoHint && <p className="mt-5 text-[11px] text-ink-soft bg-cream rounded-lg p-3">{demoHint}</p>}
    </div>
  );
}
