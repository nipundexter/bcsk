import { requireStudent } from "@/lib/auth";
import { db } from "@/lib/db";

const krw = (n: number) => `₩${n.toLocaleString("en-US")}`;

/** FR-STU-08: payment report and past receipts. */
export default async function StudentPaymentsPage() {
  const session = await requireStudent();
  const payments = await db.payment.findMany({
    where: { payerUserId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-navy mb-6">Payment Report</h1>
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream text-navy text-left">
              <th className="px-5 py-3.5 font-bold">Date</th>
              <th className="px-5 py-3.5 font-bold">Purpose</th>
              <th className="px-5 py-3.5 font-bold">Method</th>
              <th className="px-5 py-3.5 font-bold">Amount</th>
              <th className="px-5 py-3.5 font-bold">Status</th>
              <th className="px-5 py-3.5 font-bold">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-6 text-ink-soft">No payments on record.</td></tr>
            )}
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="px-5 py-3">{p.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</td>
                <td className="px-5 py-3">{p.purpose.replace(/_/g, " ")}</td>
                <td className="px-5 py-3">{p.method === "CARD" ? "Card" : "Bank transfer"}</td>
                <td className="px-5 py-3 font-bold text-ink">{krw(p.amount)}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-bold rounded-full px-3 py-1 ${
                    ["PAID", "VERIFIED"].includes(p.status) ? "bg-teal/15 text-teal"
                    : p.status === "PENDING_VERIFICATION" ? "bg-sunrise/15 text-sunrise-deep"
                    : p.status === "REFUNDED" ? "bg-sky-soft text-navy"
                    : "bg-red-50 text-red-600"
                  }`}>
                    {p.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {["PAID", "VERIFIED"].includes(p.status) ? (
                    <a href={`/api/receipts/${p.id}`} className="text-sky font-bold hover:underline">PDF</a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
