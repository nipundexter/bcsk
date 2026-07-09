import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sendMail, emailLayout } from "@/lib/email";
import { SEMESTER_CURRENT, classLevelLabel } from "@/lib/constants";

export const krw = (n: number) => `₩${n.toLocaleString("en-US")}`;

/** FR-ADM-05/FR-ADM-06: compute the amount due for an application from FeeConfig. */
export async function computeApplicationFee(app: {
  type: string;
  grade: string | null;
  courseName: string | null;
}, isBcskStudent = false): Promise<{ amount: number; breakdown: string }> {
  if (app.type === "REGULAR" || app.type === "RE_ADMISSION") {
    const key = (app.grade ?? "").toLowerCase(); // PRE_PRIMARY -> pre_primary
    const fee = await db.feeConfig.findUnique({ where: { key } });
    if (!fee) throw new Error(`No fee configured for ${app.grade}`);
    if (app.type === "RE_ADMISSION") {
      return { amount: fee.semesterFee, breakdown: `Semester fee ${krw(fee.semesterFee)} (admission fee waived for re-admission)` };
    }
    return {
      amount: fee.admissionFee + fee.semesterFee,
      breakdown: `Admission fee ${krw(fee.admissionFee)} + Semester fee ${krw(fee.semesterFee)}`,
    };
  }
  // SPECIAL
  const slugToKey: Record<string, string> = {
    "ielts-for-kids": "ielts_for_kids",
    abacus: "abacus",
    deen: "deen",
    hifz: "hifz",
    "debate-club": "debate_club",
    "bangla-language": "bangla_language",
  };
  const key = slugToKey[app.courseName ?? ""] ?? app.courseName ?? "";
  const fee = await db.feeConfig.findUnique({ where: { key } });
  if (!fee) throw new Error(`No fee configured for course ${app.courseName}`);
  const course = isBcskStudent ? fee.bcskPrice ?? 0 : fee.nonBcskPrice ?? 0;
  return {
    amount: fee.admissionFee + course,
    breakdown: `Admission fee ${krw(fee.admissionFee)} + Course fee ${krw(course)} (${isBcskStudent ? "BCSK" : "non-BCSK"} student rate)`,
  };
}

export function newVirtualRef(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `BCSK-VR-${ymd}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

/** Generate the next sequential Student ID, e.g. BCSK-2026-0003. */
export async function nextStudentId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `BCSK-${year}-`;
  const last = await db.studentProfile.findFirst({
    where: { studentId: { startsWith: prefix } },
    orderBy: { studentId: "desc" },
  });
  const n = last ? Number(last.studentId.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(n).padStart(4, "0")}`;
}

/**
 * UC-2 / FR-ADM-09: once payment is confirmed, create the student account,
 * enroll them, and email credentials to the guardian.
 */
export async function activateEnrollmentForApplication(applicationId: number): Promise<{ studentId: string } | { error: string }> {
  const app = await db.applicationForm.findUnique({ where: { id: applicationId } });
  if (!app) return { error: "Application not found" };
  if (app.createdStudentUserId) {
    const existing = await db.studentProfile.findFirst({ where: { userId: app.createdStudentUserId } });
    return { studentId: existing?.studentId ?? "already-active" };
  }

  const studentId = await nextStudentId();
  const tempPassword = randomBytes(4).toString("hex"); // 8 chars
  const hash = await bcrypt.hash(tempPassword, 10);

  const user = await db.user.create({
    data: {
      loginId: studentId,
      name: app.applicantName,
      email: app.email,
      passwordHash: hash,
      role: "STUDENT",
      studentProfile: {
        create: {
          studentId,
          classLevel: app.type === "SPECIAL" ? "SPECIAL" : app.grade ?? "PRE_PRIMARY",
          photoUrl: app.photoUrl,
          dob: app.dob,
          gender: app.gender,
          religion: app.religion,
          fatherName: app.fatherName,
          motherName: app.motherName,
          guardianProfession: app.guardianProfession,
          guardianEducation: app.guardianEducation,
          guardianPhone: app.phone,
          guardianEmail: app.email,
          addressKorea: app.addressKorea,
          addressBangladesh: app.addressBangladesh,
          emergencyContact: app.emergencyContact,
        },
      },
    },
  });

  // enroll: regular → all sessions of that class; special → sessions of that course (first level)
  if (app.type === "REGULAR" && app.grade) {
    const sessions = await db.classSession.findMany({ where: { classLevel: app.grade, semester: SEMESTER_CURRENT, active: true } });
    for (const s of sessions) {
      await db.enrollment.create({ data: { studentUserId: user.id, classSessionId: s.id, semester: SEMESTER_CURRENT } });
    }
  } else if (app.type === "SPECIAL" && app.courseName) {
    const course = await db.course.findUnique({ where: { slug: app.courseName } });
    if (course) {
      const session = await db.classSession.findFirst({
        where: { courseId: course.id, semester: SEMESTER_CURRENT, active: true },
        orderBy: { id: "asc" },
      });
      if (session) {
        await db.enrollment.create({ data: { studentUserId: user.id, classSessionId: session.id, semester: SEMESTER_CURRENT } });
      }
    }
  }

  await db.applicationForm.update({
    where: { id: app.id },
    data: { status: "APPROVED", createdStudentUserId: user.id },
  });

  if (app.email) {
    await sendMail(
      app.email,
      "BCSK Admission Confirmed — Classroom login details",
      emailLayout(
        "Welcome to BCSK!",
        `<p style="font-size:14px;color:#232323">The admission for <b>${app.applicantName}</b> is confirmed. The Classroom portal is now available:</p>
         <table style="font-size:14px;color:#232323;margin:12px 0">
           <tr><td style="padding:4px 12px 4px 0;color:#5b5b6b">Student ID</td><td><b>${studentId}</b></td></tr>
           <tr><td style="padding:4px 12px 4px 0;color:#5b5b6b">Temporary password</td><td><b>${tempPassword}</b></td></tr>
         </table>
         <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/classroom" style="display:inline-block;background:#f5820b;color:#fff;text-decoration:none;font-weight:bold;border-radius:8px;padding:10px 22px;font-size:14px">Open the Classroom portal</a></p>
         <p style="font-size:12px;color:#5b5b6b">Please change the password after first login (Forgot password → reset).</p>`
      )
    );
  }
  return { studentId };
}

/** Server-side Toss Payments confirmation (never trust the redirect alone). */
export async function confirmTossPayment(paymentKey: string, orderId: string, amount: number) {
  const secret = process.env.TOSS_SECRET_KEY ?? "";
  const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${secret}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message ?? `Payment confirmation failed (${res.status})`);
  }
  return data as { paymentKey: string; orderId: string; totalAmount: number; status: string };
}
