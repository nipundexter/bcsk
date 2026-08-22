"use client";

import { useActionState, useTransition } from "react";
import { updateCourse, updateLevel, addLevel, type CourseState } from "./actions";

type Level = { id: number; name: string; syllabus: string; studentBookUrl: string | null; workBookUrl: string | null };
type Course = { id: number; slug: string; name: string; type: string; description: string; active: boolean; levels: Level[] };

const input = "w-full rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-sky focus:outline-none";

export function CourseEditor({ courses }: { courses: Course[] }) {
  const [, startAdd] = useTransition();

  return (
    <div className="space-y-4">
      {courses.map((c) => (
        <details key={c.id} className="bg-white rounded-2xl border border-line">
          <summary className="cursor-pointer px-6 py-4 flex flex-wrap items-center gap-3">
            <span className="font-bold text-navy">{c.name}</span>
            <span className="text-[10px] font-extrabold uppercase bg-cream rounded-full px-2.5 py-1">{c.type}</span>
            {!c.active && <span className="text-[10px] font-extrabold uppercase bg-red-50 text-red-600 rounded-full px-2.5 py-1">Inactive</span>}
            <span className="ml-auto text-xs text-ink-soft">{c.levels.length} levels</span>
          </summary>
          <div className="px-6 pb-6 space-y-5">
            <CourseForm course={c} />
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-navy">Levels & Books</h3>
                <button
                  onClick={() => startAdd(() => addLevel(c.id))}
                  className="text-xs font-bold text-sky hover:underline"
                >
                  + Add level
                </button>
              </div>
              <div className="space-y-3">
                {c.levels.map((l) => (
                  <LevelForm key={l.id} level={l} />
                ))}
              </div>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}

function CourseForm({ course }: { course: Course }) {
  const [state, action, pending] = useActionState<CourseState, FormData>(updateCourse, null);
  return (
    <form action={action} className="bg-cream rounded-xl p-4 space-y-3">
      <input type="hidden" name="id" value={course.id} />
      <div className="flex flex-wrap gap-3 items-center">
        <input name="name" defaultValue={course.name} className={`${input} max-w-xs`} />
        <label className="flex items-center gap-2 text-xs font-bold text-ink">
          <input type="checkbox" name="active" defaultChecked={course.active} className="w-4 h-4 accent-teal" />
          Active
        </label>
        <button disabled={pending} className="ml-auto bg-navy hover:bg-navy-deep disabled:opacity-60 text-white text-xs font-bold rounded-lg px-4 py-2 transition-colors">
          {pending ? "…" : "Save course"}
        </button>
        {state?.ok && <span className="text-xs font-bold text-teal">✓</span>}
        {state?.error && <span className="text-xs font-semibold text-red-600">{state.error}</span>}
      </div>
      <textarea name="description" rows={2} defaultValue={course.description} className={input} placeholder="Public description" />
    </form>
  );
}

function LevelForm({ level }: { level: Level }) {
  const [state, action, pending] = useActionState<CourseState, FormData>(updateLevel, null);
  return (
    <form action={action} className="border border-line rounded-xl p-4 space-y-2.5">
      <input type="hidden" name="id" value={level.id} />
      <div className="flex flex-wrap items-center gap-3">
        <input name="name" defaultValue={level.name} className="rounded-lg border border-line px-3 py-2 text-sm font-bold w-40 focus:border-sky focus:outline-none" />
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-ink-soft">
          <label>
            Student Book {level.studentBookUrl && <span className="text-teal">(uploaded ✓)</span>}
            <input type="file" name="studentBook" accept="application/pdf" className="block mt-1 text-[10px] file:mr-2 file:rounded file:border-0 file:bg-cream file:px-2 file:py-1 file:text-[10px] file:font-bold" />
          </label>
          <label>
            Work Book {level.workBookUrl && <span className="text-teal">(uploaded ✓)</span>}
            <input type="file" name="workBook" accept="application/pdf" className="block mt-1 text-[10px] file:mr-2 file:rounded file:border-0 file:bg-cream file:px-2 file:py-1 file:text-[10px] file:font-bold" />
          </label>
        </div>
        <button disabled={pending} className="ml-auto bg-navy hover:bg-navy-deep disabled:opacity-60 text-white text-[11px] font-bold rounded-lg px-4 py-2 transition-colors">
          {pending ? "…" : "Save level"}
        </button>
        {state?.ok && <span className="text-xs font-bold text-teal">✓</span>}
        {state?.error && <span className="text-xs font-semibold text-red-600">{state.error}</span>}
      </div>
      <textarea name="syllabus" rows={2} defaultValue={level.syllabus} className={`${input} text-xs`} placeholder="Syllabus / topic coverage" />
    </form>
  );
}
