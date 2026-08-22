"use server";

import { revalidatePath } from "next/cache";
import { office, files, toActionError } from "@/services";

/**
 * Teacher actions for one class.
 *
 * Every one passes the class id to the backend, which re-derives ownership from the database
 * rather than trusting it — the `ownSession` pattern, now enforced server-side for both the
 * web app and any mobile client.
 */

export async function toggleLive(classSessionId: number, live: boolean, zoomLink?: string) {
  await office.setLive(classSessionId, live, zoomLink);
  revalidatePath(`/office/classes/${classSessionId}`);
  revalidatePath("/classroom/dashboard");
}

export async function markAttendance(classSessionId: number, formData: FormData) {
  const date = String(formData.get("date") ?? new Date().toISOString().slice(0, 10));
  const entries = [...formData.entries()]
    .filter(([k]) => k.startsWith("att-"))
    .map(([k, v]) => ({ studentUserId: Number(k.slice(4)), status: String(v) }));
  await office.markAttendance(classSessionId, date, entries);
  revalidatePath(`/office/classes/${classSessionId}`);
}

export type TeacherFormState = { ok?: boolean; error?: string } | null;

export async function postAssignment(_prev: TeacherFormState, formData: FormData): Promise<TeacherFormState> {
  const classSessionId = Number(formData.get("classSessionId"));
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Give the assignment a title." };

  try {
    let filePath: string | undefined;
    const file = formData.get("file");
    if (file instanceof File && file.size > 0) {
      filePath = (await files.upload(file, "assignments")).path;
    }
    await office.postAssignment(classSessionId, {
      title,
      description: String(formData.get("description") ?? "").trim() || undefined,
      dueDate: String(formData.get("dueDate") ?? "") || undefined,
      filePath,
    });
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath(`/office/classes/${classSessionId}`);
  return { ok: true };
}

export async function gradeSubmission(_prev: TeacherFormState, formData: FormData): Promise<TeacherFormState> {
  const submissionId = Number(formData.get("submissionId"));
  const grade = String(formData.get("grade") ?? "").trim();
  const feedback = String(formData.get("feedback") ?? "").trim();
  if (!grade) return { error: "Enter a grade." };
  try {
    await office.grade(submissionId, grade, feedback || undefined);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/office/classes");
  return { ok: true };
}

export async function addClassVideo(_prev: TeacherFormState, formData: FormData): Promise<TeacherFormState> {
  const classSessionId = Number(formData.get("classSessionId"));
  const title = String(formData.get("title") ?? "").trim();
  const videoUrl = String(formData.get("videoUrl") ?? "").trim();
  if (!title || !videoUrl) {
    return { error: "Provide a title and a video link (YouTube/Zoom recording URL)." };
  }
  try {
    await office.addVideo(classSessionId, title, videoUrl);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath(`/office/classes/${classSessionId}`);
  return { ok: true };
}
