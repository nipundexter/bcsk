"use server";

import { revalidatePath } from "next/cache";
import { requireTeacher } from "@/lib/auth";
import { db } from "@/lib/db";

export type AnswerState = { ok?: boolean; error?: string } | null;

export async function answerQuestion(_prev: AnswerState, formData: FormData): Promise<AnswerState> {
  const session = await requireTeacher();
  const questionId = Number(formData.get("questionId"));
  const answer = String(formData.get("answer") ?? "").trim();
  if (!answer) return { error: "Write an answer first." };

  const q = await db.question.findUnique({ where: { id: questionId } });
  if (!q || q.teacherUserId !== session.userId) return { error: "Not your question." };

  await db.question.update({ where: { id: questionId }, data: { answer, answeredAt: new Date() } });
  await db.notification.create({
    data: {
      userId: q.studentUserId,
      title: "Your teacher replied",
      body: q.subject,
      kind: "QUESTION",
      link: "/classroom/ask-teacher",
    },
  });
  revalidatePath("/office/questions");
  return { ok: true };
}
