import { requirePermission } from "@/lib/auth";
import { admin } from "@/services";
import { classLevelLabel } from "@/lib/constants";
import { ResultEntryForm } from "./ResultEntryForm";

/** FR-ADMIN-09: reports — certificates, result sheets, ID cards per student; result entry. */
export default async function ReportsPage() {
  await requirePermission("reports:manage");
  // Deactivated accounts keep their records but are not offered for new documents.
  const students = (await admin.students()).filter((s) => s.active);

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl font-semibold text-navy mb-6">Reports & Documents</h1>

      <ResultEntryForm
        students={students.map((s) => ({ userId: s.id, label: `${s.name} (${s.studentProfile?.studentId})` }))}
      />

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream text-navy text-left">
              <th className="px-4 py-3.5 font-bold">Student</th>
              <th className="px-4 py-3.5 font-bold">Class</th>
              <th className="px-4 py-3.5 font-bold">Results on file</th>
              <th className="px-4 py-3.5 font-bold">Generate documents</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <span className="font-bold text-ink">{s.name}</span>
                  <span className="block text-[11px] text-ink-soft">{s.studentProfile?.studentId}</span>
                </td>
                <td className="px-4 py-3">{s.studentProfile ? classLevelLabel(s.studentProfile.classLevel) : "—"}</td>
                <td className="px-4 py-3 text-ink-soft">{s._count.examResults}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <a href={`/api/admin/documents/${s.id}/certificate`} className="text-[11px] font-bold bg-cream hover:bg-cream-deep text-navy rounded-lg px-3 py-1.5 transition-colors">
                      📜 Certificate
                    </a>
                    <a href={`/api/admin/documents/${s.id}/id-card`} className="text-[11px] font-bold bg-cream hover:bg-cream-deep text-navy rounded-lg px-3 py-1.5 transition-colors">
                      🪪 ID Card
                    </a>
                    <a href={`/api/admin/documents/${s.id}/result-sheet`} className="text-[11px] font-bold bg-cream hover:bg-cream-deep text-navy rounded-lg px-3 py-1.5 transition-colors">
                      📈 Result Sheet
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-soft">
        Financial exports live under Payments → Export CSV. Documents record a serial in the certificate registry
        and are verifiable via their QR / <code>/verify/&lt;serial&gt;</code>.
      </p>
    </div>
  );
}
