"use client";

import { useState, useTransition } from "react";
import { resetUserPassword, setUserActive } from "./actions";

export function UserRowActions({ userId, active }: { userId: number; active: boolean }) {
  const [pending, start] = useTransition();
  const [tempPw, setTempPw] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await resetUserPassword(userId);
            setTempPw(result.password ?? null);
            setError(result.error ?? null);
          })
        }
        className="border border-line hover:border-sky text-ink-soft hover:text-navy text-[11px] font-bold rounded-lg px-3 py-1.5 transition-colors"
      >
        Reset password
      </button>
      <button
        disabled={pending}
        onClick={() => start(async () => setError((await setUserActive(userId, !active)).error ?? null))}
        className={`text-[11px] font-bold rounded-lg px-3 py-1.5 transition-colors ${
          active ? "border border-red-200 text-red-600 hover:bg-red-50" : "bg-teal text-white hover:bg-teal/85"
        }`}
      >
        {active ? "Deactivate" : "Reactivate"}
      </button>
      {tempPw && (
        <span className="text-[11px] font-bold text-navy bg-sky-soft rounded px-2 py-1">
          New: <code>{tempPw}</code>
        </span>
      )}
      {error && <span className="text-[11px] font-semibold text-red-600">{error}</span>}
    </div>
  );
}
