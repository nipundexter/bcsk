"use server";

import { revalidatePath } from "next/cache";
import { office, toActionError } from "@/services";

export type AnswerState = { ok?: boolean; error?: string } | null;

/** The backend re-derives ownership: a teacher may only answer their own questions. */
export async function answerQuestion(_prev: AnswerState, formData: FormData): Promise<AnswerState> {
  const questionId = Number(formData.get("questionId"));
  const answer = String(formData.get("answer") ?? "").trim();
  if (!answer) return { error: "Write an answer first." };
  try {
    await office.answer(questionId, answer);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/office/questions");
  return { ok: true };
}
