"use client";

import { useActionState, useState, useTransition } from "react";
import { saveMember, deleteMember, type GovState } from "./actions";

type Member = {
  id: number;
  kind: string;
  name: string;
  role: string;
  organization: string | null;
  region: string | null;
  phone: string | null;
  email: string | null;
  bio: string | null;
  displayOrder: number;
};
const input = "w-full rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-sky focus:outline-none";

export function GoverningEditor({ members }: { members: Member[] }) {
  const [editing, setEditing] = useState<Member | "new" | null>(null);
  const [state, action, pending] = useActionState<GovState, FormData>(saveMember, null);
  const [, startDelete] = useTransition();
  const current = editing === "new" ? null : editing;

  return (
    <div>
      <button
        onClick={() => setEditing(editing === "new" ? null : "new")}
        className="mb-5 bg-sunrise hover:bg-sunrise-deep text-white text-xs font-bold rounded-lg px-4 py-2.5 transition-colors"
      >
        {editing === "new" ? "Close" : "+ Add member"}
      </button>

      {editing !== null && (
        <form key={current?.id ?? "new"} action={action} className="bg-white rounded-2xl border border-line p-6 space-y-4 mb-6">
          <input type="hidden" name="id" value={current?.id ?? 0} />
          <div className="grid sm:grid-cols-3 gap-4">
            <label className="block text-xs font-bold text-ink">
              List
              <select name="kind" defaultValue={current?.kind ?? "GOVERNING"} className={`mt-1.5 ${input}`}>
                <option value="GOVERNING">Governing Body</option>
                <option value="REGIONAL">Regional Representative</option>
              </select>
            </label>
            <label className="block text-xs font-bold text-ink">
              Name
              <input name="name" required defaultValue={current?.name ?? ""} className={`mt-1.5 ${input}`} />
            </label>
            <label className="block text-xs font-bold text-ink">
              Role
              <input name="role" required defaultValue={current?.role ?? ""} placeholder="Chairman / Member / Representative" className={`mt-1.5 ${input}`} />
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block text-xs font-bold text-ink">
              Organization / position
              <input name="organization" defaultValue={current?.organization ?? ""} className={`mt-1.5 ${input}`} />
            </label>
            <label className="block text-xs font-bold text-ink">
              Region (for representatives)
              <input name="region" defaultValue={current?.region ?? ""} className={`mt-1.5 ${input}`} />
            </label>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <label className="block text-xs font-bold text-ink">
              Phone
              <input name="phone" defaultValue={current?.phone ?? ""} className={`mt-1.5 ${input}`} />
            </label>
            <label className="block text-xs font-bold text-ink">
              Email
              <input name="email" type="email" defaultValue={current?.email ?? ""} className={`mt-1.5 ${input}`} />
            </label>
            <label className="block text-xs font-bold text-ink">
              Order
              <input name="displayOrder" type="number" defaultValue={current?.displayOrder ?? 100} className={`mt-1.5 ${input}`} />
            </label>
          </div>
          <label className="block text-xs font-bold text-ink">
            Bio / note
            <textarea name="bio" rows={2} defaultValue={current?.bio ?? ""} className={`mt-1.5 ${input}`} />
          </label>
          <div className="flex items-center gap-3">
            <button disabled={pending} className="bg-navy hover:bg-navy-deep disabled:opacity-60 text-white text-sm font-bold rounded-lg px-6 py-2.5 transition-colors">
              {pending ? "Saving…" : "Save member"}
            </button>
            {state?.ok && <span className="text-sm font-bold text-teal">Saved ✓</span>}
            {state?.error && <span className="text-sm font-semibold text-red-600">{state.error}</span>}
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-line divide-y divide-line">
        {members.map((m) => (
          <div key={m.id} className="px-5 py-3.5 flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-extrabold uppercase bg-cream rounded-full px-2.5 py-1 w-24 text-center">
              {m.kind === "GOVERNING" ? "Governing" : "Regional"}
            </span>
            <div className="min-w-48 flex-1">
              <p className="font-bold text-ink text-sm">{m.name}</p>
              <p className="text-[11px] text-ink-soft">{m.role}{m.organization ? ` · ${m.organization}` : ""}</p>
            </div>
            <button onClick={() => setEditing(m)} className="text-xs font-bold text-sky hover:underline">Edit</button>
            <button
              onClick={() => { if (confirm(`Remove ${m.name}?`)) startDelete(() => deleteMember(m.id)); }}
              className="text-xs font-bold text-red-600 hover:underline"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
