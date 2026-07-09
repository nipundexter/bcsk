"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, audit } from "@/lib/auth";
import { db } from "@/lib/db";

export type ResultState = { ok?: boolean; error?: string } | null;

export async function addExamResult(_prev: ResultState, formData: FormData): Promise<ResultState> {
  const admin = await requireAdmin();
  const studentUserId = Number(formData.get("studentUserId"));
  const semester = String(formData.get("semester") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const marks = Number(formData.get("marks"));
  const fullMarks = Number(formData.get("fullMarks") ?? 100) || 100;
  const grade = String(formData.get("grade") ?? "").trim() || null;
  if (!studentUserId || !semester || !subject || Number.isNaN(marks)) {
    return { error: "Student, semester, subject, and marks are required." };
  }
  await db.examResult.upsert({
    where: { studentUserId_semester_subject: { studentUserId, semester, subject } },
    update: { marks, fullMarks, grade },
    create: { studentUserId, semester, subject, marks, fullMarks, grade },
  });
  await audit(admin.userId, "RESULT_ENTRY", "ExamResult", `${studentUserId}/${semester}/${subject}`, `${marks}/${fullMarks}`);
  revalidatePath("/admin/reports");
  revalidatePath("/classroom/results");
  return { ok: true };
}
