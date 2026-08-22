"use server";

import { revalidatePath } from "next/cache";
import { requirePermission, audit } from "@/lib/auth";
import { db } from "@/lib/db";
import { activateEnrollmentForApplication } from "@/lib/payments";
import { sendMail, emailLayout } from "@/lib/email";
import { SEMESTER_CURRENT } from "@/lib/constants";

/** UC-2 / FR-ADMIN-04: verify a manual bank transfer. */
export async function verifyPayment(paymentId: number) {
  const admin = await requirePermission("payments:verify");
  const payment = await db.payment.findUnique({ where: { id: paymentId }, include: { application: true, payer: true } });
  if (!payment || payment.status !== "PENDING_VERIFICATION") return;

  await db.payment.update({
    where: { id: paymentId },
    data: { status: "VERIFIED", verifiedById: admin.userId, verifiedAt: new Date() },
  });

  if (payment.applicationId) {
    // admission payment → create student account + enrollments + credentials email
    await activateEnrollmentForApplication(payment.applicationId);
  } else if (payment.payerUserId && payment.purpose === "RE_ADMISSION") {
    // FR-ADM-10: renew the student's enrollments for the current semester
    const student = await db.studentProfile.findUnique({ where: { userId: payment.payerUserId }, include: { user: true } });
    if (student) {
      const sessions = await db.classSession.findMany({
        where: { classLevel: student.classLevel, semester: SEMESTER_CURRENT, active: true },
      });
      // PERF-3: one transaction instead of a round-trip per class session.
      const payerUserId = payment.payerUserId;
      await db.$transaction(
        sessions.map((cs) =>
          db.enrollment.upsert({
            where: {
              studentUserId_classSessionId_semester: {
                studentUserId: payerUserId,
                classSessionId: cs.id,
                semester: SEMESTER_CURRENT,
              },
            },
            update: { status: "ACTIVE" },
            create: { studentUserId: payerUserId, classSessionId: cs.id, semester: SEMESTER_CURRENT },
          })
        )
      );
      await db.notification.create({
        data: {
          userId: payment.payerUserId,
          title: "Re-admission confirmed",
          body: `Your enrollment for semester ${SEMESTER_CURRENT} is renewed.`,
          kind: "ADMIN",
        },
      });
      if (student.guardianEmail || student.user.email) {
        await sendMail(
          student.guardianEmail ?? student.user.email!,
          "BCSK re-admission confirmed",
          emailLayout("Re-admission confirmed", `<p style="font-size:14px;color:#232323">${student.user.name}'s enrollment for semester ${SEMESTER_CURRENT} is confirmed. The payment receipt is available in the Classroom portal.</p>`)
        );
      }
    }
  }

  await audit(admin.userId, "PAYMENT_VERIFY", "Payment", paymentId, `verified ₩${payment.amount}`);
  revalidatePath("/admin/payments");
}

/** FR-ADMIN-04: reject a bank transfer with reason. */
export async function rejectPayment(paymentId: number, formData: FormData) {
  const admin = await requirePermission("payments:verify");
  const reason = String(formData.get("reason") ?? "").trim() || "Receipt could not be matched to a bank transfer";
  const payment = await db.payment.findUnique({ where: { id: paymentId }, include: { application: true, payer: { include: { studentProfile: true } } } });
  if (!payment || payment.status !== "PENDING_VERIFICATION") return;

  await db.payment.update({
    where: { id: paymentId },
    data: { status: "REJECTED", rejectReason: reason, verifiedById: admin.userId, verifiedAt: new Date() },
  });
  if (payment.applicationId) {
    await db.applicationForm.update({ where: { id: payment.applicationId }, data: { status: "CORRECTIONS_REQUESTED", correctionNote: reason } });
  }
  const email = payment.application?.email ?? payment.payer?.studentProfile?.guardianEmail ?? payment.payer?.email;
  if (email) {
    await sendMail(
      email,
      "BCSK payment could not be verified",
      emailLayout(
        "Payment verification failed",
        `<p style="font-size:14px;color:#232323">We could not verify the bank transfer${payment.virtualRef ? ` (ref ${payment.virtualRef})` : ""}.</p>
         <p style="font-size:14px;color:#232323"><b>Reason:</b> ${reason}</p>
         <p style="font-size:14px;color:#232323">Please contact the office (bcskr22@gmail.com, +82 10-6893-6237) or submit a corrected receipt.</p>`
      )
    );
  }
  await audit(admin.userId, "PAYMENT_REJECT", "Payment", paymentId, reason);
  revalidatePath("/admin/payments");
}

/** FR-ADMIN-04: mark a confirmed payment refunded. */
export async function refundPayment(paymentId: number, formData: FormData) {
  const admin = await requirePermission("payments:refund");
  const reason = String(formData.get("reason") ?? "").trim() || "Refund approved by office";
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment || !["PAID", "VERIFIED"].includes(payment.status)) return;
  await db.payment.update({
    where: { id: paymentId },
    data: { status: "REFUNDED", rejectReason: reason, verifiedById: admin.userId, verifiedAt: new Date() },
  });
  await audit(admin.userId, "PAYMENT_REFUND", "Payment", paymentId, reason);
  revalidatePath("/admin/payments");
}
