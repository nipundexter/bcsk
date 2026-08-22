"use client";

import { useActionState, useState } from "react";
import { createSession, type SchedState } from "./actions";

const input = "rounded-lg border border-line px-3 py-2 text-sm focus:border-sky focus:outline-none";

export function NewSessionForm({
  courses,
  teachers,
}: {
  courses: { id: number; name: string; levels: { id: number; name: string }[] }[];
  teachers: { id: number; name: string }[];
}) {
  const [state, action, pending] = useActionState<SchedState, FormData>(createSession, null);
  const [courseId, setCourseId] = useState<number>(courses[0]?.id ?? 0);
  const levels = courses.find((c) => c.id === courseId)?.levels ?? [];

  return (
    <details className="bg-white rounded-2xl border border-line">
      <summary className="cursor-pointer px-5 py-3.5 font-bold text-navy text-sm">+ New class session</summary>
      <form action={action} className="px-5 pb-5 flex flex-wrap gap-3 items-end">
        <label className="block text-xs font-bold text-ink">
          Course
          <select name="courseId" value={courseId} onChange={(e) => setCourseId(Number(e.target.value))} className={`block mt-1 ${input}`}>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        {levels.length > 0 && (
          <label className="block text-xs font-bold text-ink">
            Level
            <select name="courseLevelId" className={`block mt-1 ${input}`}>
              <option value="">—</option>
              {levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </label>
        )}
        <label className="block text-xs font-bold text-ink">
          Regular class (optional)
          <select name="classLevel" className={`block mt-1 ${input}`}>
            <option value="">—</option>
            {["PRE_PRIMARY", "CLASS_1", "CLASS_2", "CLASS_3", "CLASS_4", "CLASS_5"].map((c) => (
              <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-bold text-ink">
          Title
          <input name="title" required placeholder="e.g. Class 3 – Science" className={`block mt-1 ${input}`} />
        </label>
        <label className="block text-xs font-bold text-ink">
          Day
          <select name="dayOfWeek" className={`block mt-1 ${input}`}>
            {["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((d) => <option key={d}>{d}</option>)}
          </select>
        </label>
        <label className="block text-xs font-bold text-ink">
          Start
          <input name="startTime" defaultValue="10:00" className={`block mt-1 w-20 ${input}`} />
        </label>
        <label className="block text-xs font-bold text-ink">
          End
          <input name="endTime" defaultValue="10:50" className={`block mt-1 w-20 ${input}`} />
        </label>
        <label className="block text-xs font-bold text-ink">
          Teacher
          <select name="teacherId" className={`block mt-1 ${input}`}>
            <option value="">— unassigned —</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <button disabled={pending} className="bg-navy hover:bg-navy-deep disabled:opacity-60 text-white text-xs font-bold rounded-lg px-5 py-2.5 transition-colors">
          {pending ? "Creating…" : "Create session"}
        </button>
        {state?.error && <p className="w-full text-xs font-semibold text-red-600">{state.error}</p>}
        {state?.ok && <p className="w-full text-xs font-semibold text-teal">Session created ✓</p>}
      </form>
    </details>
  );
}
