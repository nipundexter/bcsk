import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { classLevelLabel } from "@/lib/constants";

const STATUS_STYLE: Record<string, string> = {
  APPROVED: "bg-teal/15 text-teal",
  PAID: "bg-sky-soft text-navy",
  PENDING_VERIFICATION: "bg-sunrise/15 text-sunrise-deep",
  PENDING_PAYMENT: "bg-cream text-ink-soft",
  REJECTED: "bg-red-50 text-red-600",
  CORRECTIONS_REQUESTED: "bg-purple-50 text-purple-600",
};

/** FR-ADMIN-03: admissions review module. */
export default async function AdmissionsPage() {
  await requireAdmin();
  const apps = await db.applicationForm.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy mb-6">Admissions</h1>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream text-navy text-left">
              <th className="px-4 py-3.5 font-bold">#</th>
              <th className="px-4 py-3.5 font-bold">Applicant</th>
              <th className="px-4 py-3.5 font-bold">Type</th>
              <th className="px-4 py-3.5 font-bold">Grade / Course</th>
              <th className="px-4 py-3.5 font-bold">Submitted</th>
              <th className="px-4 py-3.5 font-bold">Status</th>
              <th className="px-4 py-3.5 font-bold"></th>
            </tr>
          </thead>
          <tbody>
            {apps.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-ink-soft">No applications yet.</td></tr>}
            {apps.map((a) => (
              <tr key={a.id} className="border-t border-line">
                <td className="px-4 py-3.5 text-ink-soft">{a.id}</td>
                <td className="px-4 py-3.5 font-bold text-ink">{a.applicantName}</td>
                <td className="px-4 py-3.5">{a.type === "REGULAR" ? "Regular" : "Special"}</td>
                <td className="px-4 py-3.5">{a.grade ? classLevelLabel(a.grade) : a.courseName}</td>
                <td className="px-4 py-3.5 text-ink-soft">{a.createdAt.toISOString().slice(0, 10)}</td>
                <td className="px-4 py-3.5">
                  <span className={`text-[11px] font-bold rounded-full px-2.5 py-1 ${STATUS_STYLE[a.status] ?? "bg-cream"}`}>
                    {a.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <Link href={`/admin/admissions/${a.id}`} className="text-sky text-xs font-bold hover:underline">
                    Review →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
