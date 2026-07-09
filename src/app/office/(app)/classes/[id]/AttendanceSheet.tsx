"use client";

import { useTransition, useState } from "react";
import { markAttendance } from "./actions";

export function AttendanceSheet({
  classSessionId,
  date,
  students,
}: {
  classSessionId: number;
  date: string;
  students: { userId: number; name: string; studentId: string; current: string }[];
}) {
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <section className="bg-white rounded-2xl border border-line p-6">
      <h2 className="font-display text-lg font-semibold text-navy mb-1">Attendance — {date}</h2>
      <p className="text-xs text-ink-soft mb-4">Class roster. Choose a status per student and save.</p>
      <form
        action={(formData) => {
          start(async () => {
            await markAttendance(classSessionId, formData);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
          });
        }}
      >
        <input type="hidden" name="date" value={date} />
        <div className="divide-y divide-line">
          {students.map((s) => (
            <div key={s.userId} className="py-3 flex flex-wrap items-center gap-3">
              <div className="min-w-44">
                <p className="text-sm font-bold text-ink">{s.name}</p>
                <p className="text-[11px] text-ink-soft">{s.studentId}</p>
              </div>
              <select
                name={`att-${s.userId}`}
                defaultValue={s.current || "PRESENT"}
                aria-label={`Attendance for ${s.name}`}
                className="ml-auto rounded-lg border border-line px-3 py-2 text-xs font-bold focus:border-sky focus:outline-none"
              >
                <option value="PRESENT">Present</option>
                <option value="LATE">Late</option>
                <option value="ABSENT">Absent</option>
              </select>
            </div>
          ))}
        </div>
        {students.length === 0 ? (
          <p className="text-sm text-ink-soft">No students enrolled yet.</p>
        ) : (
          <div className="mt-4 flex items-center gap-3">
            <button
              disabled={pending}
              className="bg-navy hover:bg-navy-deep disabled:opacity-60 text-white text-xs font-bold rounded-lg px-5 py-2.5 transition-colors"
            >
              {pending ? "Saving…" : "Save attendance"}
            </button>
            {saved && <span className="text-xs font-bold text-teal">Saved ✓</span>}
          </div>
        )}
      </form>
    </section>
  );
}
