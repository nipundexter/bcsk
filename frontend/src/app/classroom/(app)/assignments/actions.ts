"use server";

import { revalidatePath } from "next/cache";
import { classroom, files, toActionError } from "@/services";

export type SubmitState = { ok?: boolean; error?: string } | null;

/**
 * Submit work for an assignment.
 *
 * Enrolment is checked by the backend — a student may only submit to a class they are
 * actually in, and that rule lives with the data rather than in this form handler.
 */
export async function submitAssignment(_prev: SubmitState, formData: FormData): Promise<SubmitState> {
  const assignmentId = Number(formData.get("assignmentId"));
  const text = String(formData.get("text") ?? "").trim();
  const file = formData.get("file");

  if (!assignmentId) return { error: "Missing assignment." };

  try {
    let filePath: string | undefined;
    if (file instanceof File && file.size > 0) {
      filePath = (await files.upload(file, "submissions")).path;
    }
    if (!filePath && !text) {
      return { error: "Attach a file or write your answer before submitting." };
    }
    await classroom.submit(assignmentId, text || undefined, filePath);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/classroom/assignments");
  return { ok: true };
}
