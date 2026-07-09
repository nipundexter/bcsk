"use client";

import { useActionState, useState } from "react";
import { createUser, type UserFormState } from "./actions";

const input = "rounded-lg border border-line px-3 py-2 text-sm focus:border-sky focus:outline-none";

export function NewUserForm() {
  const [state, action, pending] = useActionState<UserFormState, FormData>(createUser, null);
  const [role, setRole] = useState("STUDENT");

  return (
    <details className="bg-white rounded-2xl border border-line">
      <summary className="cursor-pointer px-5 py-3.5 font-bold text-navy text-sm">+ Create user account</summary>
      <form action={action} className="px-5 pb-5 flex flex-wrap gap-3 items-end">
        <label className="block text-xs font-bold text-ink">
          Role
          <select name="role" value={role} onChange={(e) => setRole(e.target.value)} className={`block mt-1 ${input}`}>
            <option value="STUDENT">Student</option>
            <option value="TEACHER">Teacher</option>
            <option value="ADMIN_SUPPORT">Admin Support</option>
            <option value="IT_SUPPORT">IT Support</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
        </label>
        <label className="block text-xs font-bold text-ink">
          Login ID
          <input name="loginId" required placeholder="e.g. BCSK-2026-0010" className={`block mt-1 ${input}`} />
        </label>
        <label className="block text-xs font-bold text-ink">
          Full name
          <input name="name" required className={`block mt-1 ${input}`} />
        </label>
        <label className="block text-xs font-bold text-ink">
          Email
          <input name="email" type="email" className={`block mt-1 ${input}`} />
        </label>
        {role === "STUDENT" && (
          <label className="block text-xs font-bold text-ink">
            Class
            <select name="classLevel" className={`block mt-1 ${input}`}>
              {["PRE_PRIMARY", "CLASS_1", "CLASS_2", "CLASS_3", "CLASS_4", "CLASS_5", "SPECIAL"].map((c) => (
                <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
              ))}
            </select>
          </label>
        )}
        {role === "TEACHER" && (
          <label className="block text-xs font-bold text-ink">
            Designation
            <input name="designation" placeholder="e.g. English Teacher" className={`block mt-1 ${input}`} />
          </label>
        )}
        <button disabled={pending} className="bg-navy hover:bg-navy-deep disabled:opacity-60 text-white text-xs font-bold rounded-lg px-5 py-2.5 transition-colors">
          {pending ? "Creating…" : "Create"}
        </button>
        {state?.error && <p className="w-full text-xs font-semibold text-red-600">{state.error}</p>}
        {state?.ok && <p className="w-full text-xs font-semibold text-teal">{state.ok}</p>}
      </form>
    </details>
  );
}
