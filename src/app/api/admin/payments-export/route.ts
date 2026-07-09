import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/constants";
import { db } from "@/lib/db";

/** FR-ADMIN-04: export payment/financial report as CSV. */
export async function GET() {
  const session = await getSession();
  if (!session || !ADMIN_ROLES.includes(session.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const payments = await db.payment.findMany({
    include: { application: true, payer: true, verifiedBy: true },
    orderBy: { createdAt: "asc" },
  });
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = [
    ["id", "date", "payer", "purpose", "method", "amount_krw", "status", "reference", "verified_by", "verified_at"].join(","),
    ...payments.map((p) =>
      [
        p.id,
        p.createdAt.toISOString(),
        esc(p.payer?.name ?? p.application?.applicantName ?? ""),
        p.purpose,
        p.method,
        p.amount,
        p.status,
        esc(p.gatewayTxnId ?? p.virtualRef ?? ""),
        esc(p.verifiedBy?.name ?? ""),
        p.verifiedAt?.toISOString() ?? "",
      ].join(",")
    ),
  ].join("\n");
  return new NextResponse(rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bcsk-payments-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
