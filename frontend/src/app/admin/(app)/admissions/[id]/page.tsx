import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { classLevelLabel } from "@/lib/constants";
import { krw } from "@/lib/payments";
import { DecisionButtons } from "./DecisionButtons";

/** FR-ADMIN-03: review, approve, reject, or request corrections. */
export default async function AdmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("admissions:read");
  const { id } = await params;
  const app = await db.applicationForm.findUnique({
    where: { id: Number(id) },
    include: { payments: { orderBy: { createdAt: "desc" } } },
  });
  if (!app) notFound();

  const rows: Array<[string, string | null]> = [
    ["Type", app.type],
    ["Grade / Course", app.grade ? classLevelLabel(app.grade) : app.courseName],
    ["Date of birth", app.dob?.toISOString().slice(0, 10) ?? null],
    ["Gender", app.gender],
    ["Religion", app.religion],
    ["Father's name", app.fatherName],
    ["Mother's name", app.motherName],
    ["Guardian profession", app.guardianProfession],
    ["Guardian education", app.guardianEducation],
    ["Phone", app.phone],
    ["Second phone", app.guardianPhone2],
    ["Email", app.email],
    ["Highest education", app.highestEducation],
    ["Address (Korea)", app.addressKorea],
    ["Address (Bangladesh)", app.addressBangladesh],
    ["Emergency contact", app.emergencyContact],
    ["PIPA consent", app.parentalConsent ? "Given by guardian at application" : "MISSING"],
    ["Note", app.adminNote],
  ];

  return (
    <div className="max-w-3xl">
      <Link href="/admin/admissions" className="text-xs font-bold text-ink-soft hover:text-sky">← All applications</Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-navy">
          Application #{app.id} — {app.applicantName}
        </h1>
        <span className="text-xs font-bold bg-cream rounded-full px-3 py-1.5">{app.status.replace(/_/g, " ")}</span>
      </div>

      <div className="mt-6 grid sm:grid-cols-[180px_1fr] gap-6">
        <div>
          {app.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/files/${app.photoUrl}`} alt={`Photo of ${app.applicantName}`} className="w-full rounded-2xl border border-line object-cover" />
          ) : (
            <div className="aspect-[3/4] rounded-2xl bg-cream flex items-center justify-center text-ink-soft text-xs">No photo</div>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-line divide-y divide-line">
          {rows.filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="px-5 py-2.5 grid grid-cols-[160px_1fr] gap-3 text-sm">
              <span className="font-bold text-ink-soft">{k}</span>
              <span className="text-ink">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <h2 className="mt-8 font-display text-lg font-semibold text-navy mb-3">Payments</h2>
      <div className="bg-white rounded-2xl border border-line divide-y divide-line">
        {app.payments.length === 0 && <p className="px-5 py-4 text-sm text-ink-soft">No payment attempts yet.</p>}
        {app.payments.map((p) => (
          <div key={p.id} className="px-5 py-3.5 flex flex-wrap items-center gap-3 text-sm">
            <span className="font-bold text-ink">{krw(p.amount)}</span>
            <span>{p.method === "CARD" ? "Card" : "Bank transfer"}</span>
            {p.virtualRef && <span className="text-xs text-ink-soft">{p.virtualRef}</span>}
            <span className="text-xs font-bold rounded-full px-2.5 py-1 bg-cream">{p.status.replace(/_/g, " ")}</span>
            {p.receiptUploadUrl && (
              <a href={`/api/files/${p.receiptUploadUrl}`} target="_blank" className="text-sky text-xs font-bold hover:underline">
                Receipt upload
              </a>
            )}
            <Link href="/admin/payments?filter=pending" className="ml-auto text-xs text-sky font-bold hover:underline">
              Manage in Payments →
            </Link>
          </div>
        ))}
      </div>

      {app.correctionNote && (
        <p className="mt-4 text-sm bg-purple-50 text-purple-700 rounded-xl p-4">
          <b>Correction requested:</b> {app.correctionNote}
        </p>
      )}

      <div className="mt-8">
        <DecisionButtons applicationId={app.id} status={app.status} />
      </div>
    </div>
  );
}
