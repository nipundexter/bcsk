"use server";

import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { saveUpload } from "@/lib/uploads";
import { computeApplicationFee, newVirtualRef, activateEnrollmentForApplication } from "@/lib/payments";
import { sendMail, emailLayout } from "@/lib/email";

/** Create the pending CARD payment row + orderId for the Toss checkout. */
export async function createCardOrder(applicationId: number, bcsk: boolean) {
  const app = await db.applicationForm.findUnique({ where: { id: applicationId } });
  if (!app) throw new Error("Application not found");
  const fee = await computeApplicationFee(app, bcsk);
  const orderId = `BCSK-${applicationId}-${randomBytes(6).toString("hex")}`;
  await db.payment.create({
    data: {
      applicationId,
      purpose: app.type === "REGULAR" ? "ADMISSION" : "SPECIAL_COURSE",
      method: "CARD",
      amount: fee.amount,
      status: "PENDING",
      gatewayOrderId: orderId,
    },
  });
  return { orderId, amount: fee.amount };
}

export type BankState = { error?: string } | null;

/** FR-ADM-06(b)/FR-ADM-07: manual bank transfer with virtual reference + receipt upload → Pending Verification. */
export async function submitBankTransfer(_prev: BankState, formData: FormData): Promise<BankState> {
  const applicationId = Number(formData.get("applicationId"));
  const bcsk = formData.get("bcsk") === "1";
  const app = await db.applicationForm.findUnique({ where: { id: applicationId } });
  if (!app) return { error: "Application not found." };

  const receipt = formData.get("receipt") as File | null;
  if (!receipt || receipt.size === 0) return { error: "Upload your bank transfer receipt (photo or PDF)." };
  const saved = await saveUpload(receipt, "receipts", 5 * 1024 * 1024);
  if ("error" in saved) return { error: saved.error };

  const fee = await computeApplicationFee(app, bcsk);
  const virtualRef = newVirtualRef();

  await db.payment.create({
    data: {
      applicationId,
      purpose: app.type === "REGULAR" ? "ADMISSION" : "SPECIAL_COURSE",
      method: "BANK_TRANSFER",
      amount: fee.amount,
      status: "PENDING_VERIFICATION",
      virtualRef,
      receiptUploadUrl: saved.path,
    },
  });
  await db.applicationForm.update({ where: { id: applicationId }, data: { status: "PENDING_VERIFICATION" } });

  if (app.email) {
    await sendMail(
      app.email,
      "BCSK application received — payment under verification",
      emailLayout(
        "We received your application",
        `<p style="font-size:14px;color:#232323">Thank you! The application for <b>${app.applicantName}</b> and your bank-transfer receipt are with our office.</p>
         <p style="font-size:14px;color:#232323">Reference: <b>${virtualRef}</b></p>
         <p style="font-size:14px;color:#232323">Our office verifies transfers within 1–2 working days. You'll receive the admission confirmation and Classroom login by email once verified.</p>`
      )
    );
  }
  redirect(`/apply/complete/${applicationId}`);
}

/** Dev-only: simulate a successful card payment end-to-end (no external gateway call). */
export async function devSimulateCardSuccess(applicationId: number, bcsk: boolean) {
  if (process.env.NODE_ENV === "production") throw new Error("Not available in production");
  const app = await db.applicationForm.findUnique({ where: { id: applicationId } });
  if (!app) throw new Error("Application not found");
  const fee = await computeApplicationFee(app, bcsk);
  await db.payment.create({
    data: {
      applicationId,
      purpose: app.type === "REGULAR" ? "ADMISSION" : "SPECIAL_COURSE",
      method: "CARD",
      amount: fee.amount,
      status: "PAID",
      gatewayTxnId: `SIMULATED-${randomBytes(6).toString("hex")}`,
      gatewayOrderId: `BCSK-SIM-${applicationId}-${randomBytes(4).toString("hex")}`,
    },
  });
  await db.applicationForm.update({ where: { id: applicationId }, data: { status: "PAID" } });
  await activateEnrollmentForApplication(applicationId);
  redirect(`/apply/complete/${applicationId}`);
}
