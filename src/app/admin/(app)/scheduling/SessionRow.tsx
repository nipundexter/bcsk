"use client";

import { useActionState } from "react";
import { updateSession, type SchedState } from "./actions";

const DAYS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const cell = "rounded border border-line px-2 py-1.5 text-xs focus:border-sky focus:outline-none";

export function SessionRow({
  session,
  teachers,
}: {
  session: {
    id: number;
    title: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string | null;
    teacherId: number | null;
    zoomLink: string | null;
    active: boolean;
    enrollmentCount: number;
  };
  teachers: { id: number; name: string }[];
}) {
  const [state, action, pending] = useActionState<SchedState, FormData>(updateSession, null);
  const formId = `sess-${session.id}`;

  return (
    <tr className={`border-t border-line ${!session.active ? "opacity-50" : ""}`}>
      <td className="px-4 py-2.5 font-bold text-ink text-xs">{session.title}</td>
      <td className="px-4 py-2.5">
        <select form={formId} name="dayOfWeek" defaultValue={session.dayOfWeek} className={cell}>
          {DAYS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </td>
      <td className="px-4 py-2.5 whitespace-nowrap">
        <input form={formId} name="startTime" defaultValue={session.startTime} className={`${cell} w-16`} />
        –
        <input form={formId} name="endTime" defaultValue={session.endTime ?? ""} className={`${cell} w-16`} />
      </td>
      <td className="px-4 py-2.5">
        <select form={formId} name="teacherId" defaultValue={session.teacherId ?? ""} className={cell}>
          <option value="">— unassigned —</option>
          {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </td>
      <td className="px-4 py-2.5 text-center text-xs font-bold text-ink-soft">{session.enrollmentCount}</td>
      <td className="px-4 py-2.5">
        <input form={formId} name="zoomLink" defaultValue={session.zoomLink ?? ""} placeholder="Zoom link" className={`${cell} w-32`} />
      </td>
      <td className="px-4 py-2.5">
        <form id={formId} action={action} className="flex items-center gap-2">
          <input type="hidden" name="id" value={session.id} />
          <label className="flex items-center gap-1 text-[10px] font-bold text-ink-soft">
            <input type="checkbox" name="active" defaultChecked={session.active} className="w-3.5 h-3.5 accent-teal" />
            on
          </label>
          <button disabled={pending} className="bg-navy hover:bg-navy-deep disabled:opacity-60 text-white text-[11px] font-bold rounded-lg px-3 py-1.5 transition-colors">
            Save
          </button>
          {state?.ok && <span className="text-[11px] font-bold text-teal">✓</span>}
        </form>
      </td>
    </tr>
  );
}
