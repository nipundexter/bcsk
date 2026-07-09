import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

/** FR-ADMIN-12: audit log of content changes, admission decisions, payment verifications. */
export default async function AuditPage() {
  await requireSuperAdmin();
  const logs = await db.auditLog.findMany({
    include: { user: { select: { name: true, loginId: true } } },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl font-semibold text-navy mb-6">Audit Log</h1>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream text-navy text-left">
              <th className="px-4 py-3.5 font-bold">When</th>
              <th className="px-4 py-3.5 font-bold">Who</th>
              <th className="px-4 py-3.5 font-bold">Action</th>
              <th className="px-4 py-3.5 font-bold">Entity</th>
              <th className="px-4 py-3.5 font-bold">Detail</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-ink-soft">No audit entries yet.</td></tr>}
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-line">
                <td className="px-4 py-2.5 text-ink-soft whitespace-nowrap">{l.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td>
                <td className="px-4 py-2.5 font-bold text-ink">{l.user?.name ?? "system"}</td>
                <td className="px-4 py-2.5"><span className="text-[11px] font-bold bg-cream rounded-full px-2.5 py-1">{l.action}</span></td>
                <td className="px-4 py-2.5">{l.entity}{l.entityId ? ` #${l.entityId}` : ""}</td>
                <td className="px-4 py-2.5 text-ink-soft">{l.detail ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
