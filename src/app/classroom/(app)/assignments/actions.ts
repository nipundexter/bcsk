"use server";

import { revalidatePath } from "next/cache";
import { requireStudent } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveUpload } from "@/lib/uploads";

export type SubmitState = { ok?: boolean; error?: string } | null;

export async function submitAssignment(_prev: SubmitState, formData: FormData): Promise<SubmitState> {
  const session = await requireStudent();
  const assignmentId = Number(formData.get("assignmentId"));
  const text = String(formData.get("text") ?? "").trim();
  const file = formData.get("file") as File | null;

  // must be enrolled in the assignment's class
  const assignment = await db.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) return { error: "Assignment not found." };
  const enrolled = await db.enrollment.findFirst({
    where: { studentUserId: session.userId, classSessionId: assignment.classSessionId, status: "ACTIVE" },
  });
  if (!enrolled) return { error: "You are not enrolled in this class." };

  let fileUrl: string | null = null;
  if (file && file.size > 0) {
    const saved = await saveUpload(file, `submissions/${session.userId}`, 5 * 1024 * 1024);
    if ("error" in saved) return { error: saved.error };
    fileUrl = saved.path;
  }
  if (!fileUrl && !text) return { error: "Attach a file or write your answer before submitting." };

  await db.submission.upsert({
    where: { assignmentId_studentUserId: { assignmentId, studentUserId: session.userId } },
    update: { fileUrl, text: text || null, submittedAt: new Date() },
    create: { assignmentId, studentUserId: session.userId, fileUrl, text: text || null },
  });
  revalidatePath("/classroom/assignments");
  return { ok: true };
}
