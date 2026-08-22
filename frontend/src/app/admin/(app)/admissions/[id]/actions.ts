"use server";

import { revalidatePath } from "next/cache";
import { requirePermission, audit } from "@/lib/auth";
import { db } from "@/lib/db";
import { activateEnrollmentForApplication } from "@/lib/payments";
import { sendMail, emailLayout } from "@/lib/email";

/** FR-ADMIN-03: approve — activates the student account if payment is confirmed. */
export async function approveApplication(applicationId: number) {
  const admin = await requirePermission("admissions:decide");
  const app = await db.applicationForm.findUnique({
    where: { id: applicationId },
    include: { payments: true },
  });
  if (!app) return;
  const hasConfirmedPayment = app.payments.some((p) => ["PAID", "VERIFIED"].includes(p.status));
  if (hasConfirmedPayment) {
    await activateEnrollmentForApplication(applicationId);
  } else {
    await db.applicationForm.update({ where: { id: applicationId }, data: { status: "APPROVED" } });
  }
  await audit(admin.userId, "ADMISSION_DECISION", "ApplicationForm", applicationId, "approved");
  revalidatePath(`/admin/admissions/${applicationId}`);
  revalidatePath("/admin/admissions");
}

export async function rejectApplication(applicationId: number, formData: FormData) {
  const admin = await requirePermission("admissions:decide");
  const reason = String(formData.get("reason") ?? "").trim() || "Application did not meet admission requirements";
  const app = await db.applicationForm.update({
    where: { id: applicationId },
    data: { status: "REJECTED", adminNote: reason },
  });
  if (app.email) {
    await sendMail(
      app.email,
      "BCSK application update",
      emailLayout(
        "About your application",
        `<p style="font-size:14px;color:#232323">We're sorry — the application for <b>${app.applicantName}</b> could not be accepted.</p>
         <p style="font-size:14px;color:#232323"><b>Reason:</b> ${reason}</p>
         <p style="font-size:14px;color:#232323">If a payment was made, our office will contact you about a refund. Questions: bcskr22@gmail.com.</p>`
      )
    );
  }
  await audit(admin.userId, "ADMISSION_DECISION", "ApplicationForm", applicationId, `rejected: ${reason}`);
  revalidatePath(`/admin/admissions/${applicationId}`);
  revalidatePath("/admin/admissions");
}

export async function requestCorrections(applicationId: number, formData: FormData) {
  const admin = await requirePermission("admissions:decide");
  const note = String(formData.get("note") ?? "").trim();
  if (!note) return;
  const app = await db.applicationForm.update({
    where: { id: applicationId },
    data: { status: "CORRECTIONS_REQUESTED", correctionNote: note },
  });
  if (app.email) {
    await sendMail(
      app.email,
      "BCSK application — correction needed",
      emailLayout(
        "One more step",
        `<p style="font-size:14px;color:#232323">Your application for <b>${app.applicantName}</b> needs a small correction before we can proceed:</p>
         <p style="font-size:14px;color:#232323;background:#fbf6ea;border-radius:8px;padding:12px">${note}</p>
         <p style="font-size:14px;color:#232323">Reply to this email or contact the office (+82 10-6893-6237) with the corrected information.</p>`
      )
    );
  }
  await audit(admin.userId, "ADMISSION_DECISION", "ApplicationForm", applicationId, `corrections: ${note}`);
  revalidatePath(`/admin/admissions/${applicationId}`);
  revalidatePath("/admin/admissions");
}
