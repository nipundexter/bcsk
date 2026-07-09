import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/constants";
import { db } from "@/lib/db";
import { receiptPdf } from "@/lib/pdf";

/** FR-ADM-08 / FR-STU-08: downloadable payment receipt PDF (owner or admin only). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  const payment = await db.payment.findUnique({
    where: { id: Number(id) },
    include: { payer: true, application: true },
  });
  if (!payment) return new NextResponse("Not found", { status: 404 });

  const isAdmin = ADMIN_ROLES.includes(session.role);
  const isOwner = payment.payerUserId === session.userId;
  if (!isAdmin && !isOwner) return new NextResponse("Forbidden", { status: 403 });
  if (!["PAID", "VERIFIED", "REFUNDED"].includes(payment.status)) {
    return new NextResponse("Receipt available after payment confirmation", { status: 409 });
  }

  let serial = payment.receiptPdfSerial;
  if (!serial) {
    serial = `BCSK-RCPT-${new Date().getFullYear()}-${String(payment.id).padStart(4, "0")}`;
    await db.payment.update({ where: { id: payment.id }, data: { receiptPdfSerial: serial } });
  }

  const buf = await receiptPdf({
    serial,
    payerName: payment.payer?.name ?? payment.application?.applicantName ?? "Applicant",
    purpose: payment.purpose,
    method: payment.method,
    amount: payment.amount,
    status: payment.status,
    reference: payment.gatewayTxnId ?? payment.virtualRef,
    date: payment.verifiedAt ?? payment.updatedAt,
  });
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${serial}.pdf"`,
    },
  });
}
