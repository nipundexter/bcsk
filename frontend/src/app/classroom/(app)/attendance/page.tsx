import { formatDate } from "@/lib/dates";
import { requireStudent } from "@/lib/auth";
import { classroom } from "@/services";

/** FR-STU-05: attendance report. */
export default async function AttendancePage() {
  const session = await requireStudent();
  const records = await classroom.attendance();
  const present = records.filter((r) => r.status === "PRESENT").length;
  const late = records.filter((r) => r.status === "LATE").length;
  const total = records.length;
  const rate = total ? Math.round(((present + late) / total) * 100) : null;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-navy mb-6">Attendance Report</h1>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-line p-5 text-center">
          <p className="font-display text-3xl font-semibold text-navy">{total}</p>
          <p className="text-xs font-bold text-ink-soft uppercase mt-1">Sessions</p>
        </div>
        <div className="bg-white rounded-2xl border border-line p-5 text-center">
          <p className="font-display text-3xl font-semibold text-teal">{present}</p>
          <p className="text-xs font-bold text-ink-soft uppercase mt-1">Present</p>
        </div>
        <div className="bg-white rounded-2xl border border-line p-5 text-center">
          <p className="font-display text-3xl font-semibold text-sunrise">{rate != null ? `${rate}%` : "—"}</p>
          <p className="text-xs font-bold text-ink-soft uppercase mt-1">Attendance</p>
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream text-navy text-left">
              <th className="px-5 py-3.5 font-bold">Date</th>
              <th className="px-5 py-3.5 font-bold">Class</th>
              <th className="px-5 py-3.5 font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && (
              <tr><td colSpan={3} className="px-5 py-6 text-ink-soft">No attendance recorded yet.</td></tr>
            )}
            {records.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="px-5 py-3">{formatDate(r.date)}</td>
                <td className="px-5 py-3">{r.classSession.title}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-bold rounded-full px-3 py-1 ${
                    r.status === "PRESENT" ? "bg-teal/15 text-teal" : r.status === "LATE" ? "bg-sunrise/15 text-sunrise-deep" : "bg-red-50 text-red-600"
                  }`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
