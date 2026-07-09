"use server";

import { revalidatePath } from "next/cache";
import { requireStudent } from "@/lib/auth";
import { db } from "@/lib/db";

export type AskState = { ok?: boolean; error?: string } | null;

export async function askQuestion(_prev: AskState, formData: FormData): Promise<AskState> {
  const session = await requireStudent();
  const teacherUserId = Number(formData.get("teacherUserId"));
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!teacherUserId || !subject || !body) return { error: "Choose a teacher and fill in both fields." };

  await db.question.create({ data: { studentUserId: session.userId, teacherUserId, subject, body } });
  // notify the teacher (FR-TCH-05)
  await db.notification.create({
    data: {
      userId: teacherUserId,
      title: `New question from ${session.name}`,
      body: subject,
      kind: "QUESTION",
      link: "/office/questions",
    },
  });
  revalidatePath("/classroom/ask-teacher");
  return { ok: true };
}
