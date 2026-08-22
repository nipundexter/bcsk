import { requireStudent } from "@/lib/auth";
import { classroom } from "@/services";
import { SEMESTER_CURRENT } from "@/lib/constants";

const DAY_ORDER = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

/** FR-STU-05: class routine. */
export default async function RoutinePage() {
  const session = await requireStudent();
  const sessions = (await classroom.routine()).sort(
    (a, b) =>
      DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek) ||
      a.startTime.localeCompare(b.startTime),
  );

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold text-navy">Class Routine</h1>
        <span className="text-xs font-bold text-ink-soft bg-white border border-line rounded-full px-3 py-1.5">
          Semester {SEMESTER_CURRENT}
        </span>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream text-navy text-left">
              <th className="px-5 py-3.5 font-bold">Day</th>
              <th className="px-5 py-3.5 font-bold">Time</th>
              <th className="px-5 py-3.5 font-bold">Class</th>
              <th className="px-5 py-3.5 font-bold">Teacher</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-t border-line">
                <td className="px-5 py-3.5 font-bold text-ink">{s.dayOfWeek}</td>
                <td className="px-5 py-3.5">{s.startTime}{s.endTime ? `–${s.endTime}` : ""}</td>
                <td className="px-5 py-3.5">{s.title}</td>
                <td className="px-5 py-3.5 text-ink-soft">{s.teacher?.user.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
