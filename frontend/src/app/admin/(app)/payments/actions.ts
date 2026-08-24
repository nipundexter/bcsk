"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { admin, toActionError } from "@/services";

/**
 * FR-ADMIN-04 — verify, reject and refund payments.
 *
 * Everything these used to do inline — flipping the payment row, activating the enrolment or
 * renewing a re-admission, emailing the payer, writing the audit entry — now happens inside
 * one backend call, in one transaction, with the state checks the frontend used to skip
 * silently. A refusal (wrong status, unknown payment) comes back as a message instead of the
 * action returning quietly and leaving the operator guessing.
 */

export type PaymentActionState = { ok?: boolean; error?: string };

export async function verifyPayment(paymentId: number): Promise<PaymentActionState> {
  await requirePermission("payments:verify");
  try {
    await admin.verifyPayment(paymentId);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/admin/payments");
  return { ok: true };
}

export async function rejectPayment(paymentId: number, formData: FormData): Promise<PaymentActionState> {
  await requirePermission("payments:verify");
  const reason =
    String(formData.get("reason") ?? "").trim() || "Receipt could not be matched to a bank transfer";
  try {
    await admin.rejectPayment(paymentId, reason);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/admin/payments");
  return { ok: true };
}

export async function refundPayment(paymentId: number, formData: FormData): Promise<PaymentActionState> {
  await requirePermission("payments:refund");
  const reason = String(formData.get("reason") ?? "").trim() || "Refund approved by office";
  try {
    await admin.refundPayment(paymentId, reason);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/admin/payments");
  return { ok: true };
}
