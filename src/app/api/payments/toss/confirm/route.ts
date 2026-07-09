import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { confirmTossPayment, activateEnrollmentForApplication } from "@/lib/payments";
import { sendMail, emailLayout } from "@/lib/email";

/**
 * Toss success redirect target. Confirms the payment server-to-server (NFR-SEC-03:
 * only a transaction reference and status are stored), then activates enrollment.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const paymentKey = url.searchParams.get("paymentKey");
  const orderId = url.searchParams.get("orderId");
  const amount = Number(url.searchParams.get("amount"));
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? url.origin;

  if (!paymentKey || !orderId || !amount) {
    return NextResponse.redirect(`${base}/apply?error=missing-params`);
  }

  const payment = await db.payment.findUnique({ where: { gatewayOrderId: orderId }, include: { application: true } });
  if (!payment || !payment.applicationId) {
    return NextResponse.redirect(`${base}/apply?error=order-not-found`);
  }
  if (payment.amount !== amount) {
    return NextResponse.redirect(
      `${base}/apply/payment/${payment.applicationId}?error=${encodeURIComponent("amount mismatch")}`
    );
  }

  try {
    const confirmed = await confirmTossPayment(paymentKey, orderId, amount);
    await db.payment.update({
      where: { id: payment.id },
      data: { status: "PAID", gatewayTxnId: confirmed.paymentKey },
    });
    await db.applicationForm.update({ where: { id: payment.applicationId }, data: { status: "PAID" } });
    await activateEnrollmentForApplication(payment.applicationId);

    // FR-ADM-08: receipt + confirmation email
    const app = payment.application!;
    if (app.email) {
      await sendMail(
        app.email,
        "BCSK payment received",
        emailLayout(
          "Payment successful",
          `<p style="font-size:14px;color:#232323">We received your card payment of <b>KRW ${amount.toLocaleString("en-US")}</b> for ${app.applicantName}'s application.</p>
           <p style="font-size:14px;color:#232323">Your payment receipt (PDF) is available from the Classroom portal → Payments, and the admission confirmation with login details follows in a separate email.</p>`
        )
      );
    }
    return NextResponse.redirect(`${base}/apply/complete/${payment.applicationId}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "confirmation failed";
    await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED", rejectReason: msg } });
    return NextResponse.redirect(`${base}/apply/payment/${payment.applicationId}?error=${encodeURIComponent(msg)}`);
  }
}
