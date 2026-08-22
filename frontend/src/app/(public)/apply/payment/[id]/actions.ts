"use server";

import { redirect } from "next/navigation";
import { payments, files, api, toActionError } from "@/services";

/**
 * The payment step.
 *
 * Every call carries the capability token issued when the application was created (SEC-7),
 * and the backend derives the amount from the stored record rather than anything sent here
 * (SEC-3). This action never sees or proposes a price.
 */

export async function createCardOrder(applicationId: number, token: string) {
  return payments.createCardOrder(applicationId, token);
}

export type BankState = { error?: string } | null;

/** FR-ADM-06(b)/FR-ADM-07: bank transfer with a receipt, pending office verification. */
export async function submitBankTransfer(_prev: BankState, formData: FormData): Promise<BankState> {
  const applicationId = Number(formData.get("applicationId"));
  const token = String(formData.get("token") ?? "");
  if (!Number.isInteger(applicationId) || applicationId <= 0) return { error: "Invalid application." };

  try {
    const receipt = formData.get("receipt");
    if (!(receipt instanceof File) || receipt.size === 0) {
      return { error: "Upload your bank transfer receipt (photo or PDF)." };
    }
    const { path } = await files.upload(receipt, "receipts");
    await api.post("/payments/bank-transfer", { applicationId, token, receiptPath: path }, { auth: false });
  } catch (e) {
    return toActionError(e);
  }
  redirect(`/apply/complete/${applicationId}?t=${encodeURIComponent(token)}`);
}
