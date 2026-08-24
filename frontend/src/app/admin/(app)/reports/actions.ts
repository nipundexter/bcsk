"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { admin, toActionError } from "@/services";

export type ResultState = { ok?: boolean; error?: string } | null;

/** FR-ADMIN-09: enter or correct one exam result; re-entering the same subject overwrites it. */
export async function addExamResult(_prev: ResultState, formData: FormData): Promise<ResultState> {
  await requirePermission("reports:manage");
  const studentUserId = Number(formData.get("studentUserId"));
  const semester = String(formData.get("semester") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const marks = Number(formData.get("marks"));
  if (!studentUserId || !semester || !subject || Number.isNaN(marks)) {
    return { error: "Student, semester, subject, and marks are required." };
  }
  const grade = String(formData.get("grade") ?? "").trim();
  try {
    await admin.addResult({
      studentUserId,
      semester,
      subject,
      marks,
      fullMarks: Number(formData.get("fullMarks") ?? 100) || 100,
      ...(grade ? { grade } : {}),
    });
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/admin/reports");
  revalidatePath("/classroom/results");
  return { ok: true };
}
