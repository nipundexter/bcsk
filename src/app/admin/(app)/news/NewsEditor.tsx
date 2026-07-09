"use client";

import { useActionState, useState, useTransition } from "react";
import { saveNews, deleteNews, type NewsState } from "./actions";

type Item = { id: number; type: string; title: string; body: string; date: string; published: boolean };
const input = "w-full rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-sky focus:outline-none";

export function NewsEditor({ items }: { items: Item[] }) {
  const [editing, setEditing] = useState<Item | "new" | null>(null);
  const [state, action, pending] = useActionState<NewsState, FormData>(saveNews, null);
  const [, startDelete] = useTransition();

  const current = editing === "new" ? null : editing;

  return (
    <div>
      <button
        onClick={() => setEditing(editing === "new" ? null : "new")}
        className="mb-5 bg-sunrise hover:bg-sunrise-deep text-white text-xs font-bold rounded-lg px-4 py-2.5 transition-colors"
      >
        {editing === "new" ? "Close" : "+ New item"}
      </button>

      {editing !== null && (
        <form key={current?.id ?? "new"} action={action} className="bg-white rounded-2xl border border-line p-6 space-y-4 mb-6">
          <input type="hidden" name="id" value={current?.id ?? 0} />
          <div className="grid sm:grid-cols-3 gap-4">
            <label className="block text-xs font-bold text-ink">
              Type
              <select name="type" defaultValue={current?.type ?? "NEWS"} className={`mt-1.5 ${input}`}>
                <option value="NEWS">News</option>
                <option value="SEMINAR">Seminar</option>
                <option value="EVENT">Event</option>
              </select>
            </label>
            <label className="block text-xs font-bold text-ink">
              Date
              <input name="date" type="date" defaultValue={current?.date ?? new Date().toISOString().slice(0, 10)} className={`mt-1.5 ${input}`} />
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-ink mt-6">
              <input type="checkbox" name="published" defaultChecked={current?.published ?? true} className="w-4 h-4 accent-teal" />
              Published
            </label>
          </div>
          <label className="block text-xs font-bold text-ink">
            Title
            <input name="title" required defaultValue={current?.title ?? ""} className={`mt-1.5 ${input}`} />
          </label>
          <label className="block text-xs font-bold text-ink">
            Body
            <textarea name="body" required rows={5} defaultValue={current?.body ?? ""} className={`mt-1.5 ${input}`} />
          </label>
          <div className="flex items-center gap-3">
            <button disabled={pending} className="bg-navy hover:bg-navy-deep disabled:opacity-60 text-white text-sm font-bold rounded-lg px-6 py-2.5 transition-colors">
              {pending ? "Saving…" : "Save"}
            </button>
            {state?.ok && <span className="text-sm font-bold text-teal">Saved ✓</span>}
            {state?.error && <span className="text-sm font-semibold text-red-600">{state.error}</span>}
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-line divide-y divide-line">
        {items.map((n) => (
          <div key={n.id} className="px-5 py-3.5 flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-extrabold uppercase text-sunrise w-16">{n.type}</span>
            <div className="min-w-48 flex-1">
              <p className="font-bold text-ink text-sm">{n.title}</p>
              <p className="text-[11px] text-ink-soft">{n.date}{!n.published && " · draft"}</p>
            </div>
            <button onClick={() => setEditing(n)} className="text-xs font-bold text-sky hover:underline">Edit</button>
            <button
              onClick={() => { if (confirm(`Delete "${n.title}"?`)) startDelete(() => deleteNews(n.id)); }}
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
