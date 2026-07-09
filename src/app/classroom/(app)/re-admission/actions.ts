"use server";

import { revalidatePath } from "next/cache";
import { requireStudent } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveUpload } from "@/lib/uploads";
import { newVirtualRef } from "@/lib/payments";
import { sendMail, emailLayout } from "@/lib/email";

export type ReAdmitState = { ok?: boolean; error?: string } | null;

/** Bank-transfer re-admission payment → Pending Verification (admin confirms → enrollment renewed). */
export async function submitReAdmission(_prev: ReAdmitState, formData: FormData): Promise<ReAdmitState> {
  const session = await requireStudent();
  const profile = await db.studentProfile.findUnique({ where: { userId: session.userId }, include: { user: true } });
  if (!profile) return { error: "Student profile not found." };

  const fee = await db.feeConfig.findUnique({ where: { key: profile.classLevel.toLowerCase() } });
  if (!fee) return { error: "No fee configured for your class — contact the office." };

  const receipt = formData.get("receipt") as File | null;
  if (!receipt || receipt.size === 0) return { error: "Upload your bank transfer receipt." };
  const saved = await saveUpload(receipt, "receipts", 5 * 1024 * 1024);
  if ("error" in saved) return { error: saved.error };

  const virtualRef = newVirtualRef();
  await db.payment.create({
    data: {
      payerUserId: session.userId,
      purpose: "RE_ADMISSION",
      method: "BANK_TRANSFER",
      amount: fee.semesterFee,
      status: "PENDING_VERIFICATION",
      virtualRef,
      receiptUploadUrl: saved.path,
    },
  });

  if (profile.guardianEmail || profile.user.email) {
    await sendMail(
      profile.guardianEmail ?? profile.user.email!,
      "BCSK re-admission received",
      emailLayout(
        "Re-admission received",
        `<p style="font-size:14px;color:#232323">We received the re-admission payment receipt for <b>${session.name}</b> (ref <b>${virtualRef}</b>). Enrollment is renewed once the office verifies the transfer.</p>`
      )
    );
  }
  revalidatePath("/classroom/re-admission");
  return { ok: true };
}
