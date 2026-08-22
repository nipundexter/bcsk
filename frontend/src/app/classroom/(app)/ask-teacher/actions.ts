"use server";

import { revalidatePath } from "next/cache";
import { classroom, toActionError } from "@/services";

export type AskState = { ok?: boolean; error?: string } | null;

/** FR-TCH-05: the backend records the question and notifies the teacher. */
export async function askQuestion(_prev: AskState, formData: FormData): Promise<AskState> {
  const teacherUserId = Number(formData.get("teacherUserId"));
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!teacherUserId || !subject || !body) {
    return { error: "Choose a teacher and fill in both fields." };
  }
  try {
    await classroom.ask(teacherUserId, subject, body);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/classroom/ask-teacher");
  return { ok: true };
}
