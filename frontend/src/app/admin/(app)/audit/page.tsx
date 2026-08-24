import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { admin } from "@/services";
import { formatDate } from "@/lib/dates";

/** FR-ADMIN-12: audit log of content changes, admission decisions, payment verifications. */
export default async function AuditPage({ searchParams }: { searchParams: Promise<{ cursor?: string }> }) {
  await requirePermission("audit:read");
  const { cursor } = await searchParams;
  // Append-only and unbounded, so it is read a page at a time rather than "the last 300".
  const { items: logs, nextCursor } = await admin.auditLog(cursor);

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
                <td className="px-4 py-2.5 text-ink-soft whitespace-nowrap">
                  {formatDate(l.createdAt, "en", {
                    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-2.5 font-bold text-ink">{l.user?.name ?? "system"}</td>
                <td className="px-4 py-2.5"><span className="text-[11px] font-bold bg-cream rounded-full px-2.5 py-1">{l.action}</span></td>
                <td className="px-4 py-2.5">{l.entity}{l.entityId ? ` #${l.entityId}` : ""}</td>
                <td className="px-4 py-2.5 text-ink-soft">{l.detail ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {nextCursor && (
        <Link
          href={`/admin/audit?cursor=${encodeURIComponent(nextCursor)}`}
          className="mt-4 inline-block text-xs font-bold text-sky hover:underline"
        >
          Older entries →
        </Link>
      )}
      {cursor && (
        <Link href="/admin/audit" className="mt-4 ml-4 inline-block text-xs font-bold text-ink-soft hover:text-navy">
          ← Back to newest
        </Link>
      )}
    </div>
  );
}
