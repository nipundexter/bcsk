"use server";

import { revalidatePath } from "next/cache";
import { classroom, files, toActionError } from "@/services";

export type ReAdmitState = { ok?: boolean; error?: string } | null;

/**
 * FR-ADM-10: re-admission by bank transfer, pending office verification.
 *
 * The amount is read from FeeConfig by the backend — this form never proposes a price
 * (SEC-3), and a duplicate pending payment is rejected there rather than here.
 */
export async function submitReAdmission(_prev: ReAdmitState, formData: FormData): Promise<ReAdmitState> {
  const receipt = formData.get("receipt");
  if (!(receipt instanceof File) || receipt.size === 0) {
    return { error: "Upload your bank transfer receipt." };
  }
  try {
    const { path } = await files.upload(receipt, "receipts");
    await classroom.submitReAdmission(path);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/classroom/re-admission");
  return { ok: true };
}
