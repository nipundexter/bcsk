"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { admin, toActionError } from "@/services";

export type SchedState = { ok?: boolean; error?: string } | null;

/**
 * FR-ADMIN-08 — the class routine.
 *
 * The semester a new session belongs to is decided by the backend, not posted from the form:
 * it is the same constant the enrolment and re-admission logic reads, and two copies of it
 * would eventually disagree.
 */
export async function updateSession(_prev: SchedState, formData: FormData): Promise<SchedState> {
  await requirePermission("scheduling:manage");
  const id = Number(formData.get("id"));
  const teacherIdRaw = String(formData.get("teacherId") ?? "");
  try {
    await admin.updateSession(id, {
      dayOfWeek: String(formData.get("dayOfWeek") ?? "Saturday"),
      startTime: String(formData.get("startTime") ?? "10:00"),
      endTime: String(formData.get("endTime") ?? ""),
      teacherId: teacherIdRaw ? Number(teacherIdRaw) : null,
      zoomLink: String(formData.get("zoomLink") ?? ""),
      active: formData.get("active") === "on",
    });
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/admin/scheduling");
  revalidatePath("/classroom/dashboard");
  revalidatePath("/office/dashboard");
  return { ok: true };
}

export async function createSession(_prev: SchedState, formData: FormData): Promise<SchedState> {
  await requirePermission("scheduling:manage");
  const courseId = Number(formData.get("courseId"));
  const title = String(formData.get("title") ?? "").trim();
  if (!courseId || !title) return { error: "Course and title are required." };
  const levelIdRaw = String(formData.get("courseLevelId") ?? "");
  const teacherIdRaw = String(formData.get("teacherId") ?? "");
  try {
    await admin.createSession({
      courseId,
      courseLevelId: levelIdRaw ? Number(levelIdRaw) : null,
      classLevel: String(formData.get("classLevel") ?? ""),
      title,
      dayOfWeek: String(formData.get("dayOfWeek") ?? "Saturday"),
      startTime: String(formData.get("startTime") ?? "10:00"),
      endTime: String(formData.get("endTime") ?? ""),
      teacherId: teacherIdRaw ? Number(teacherIdRaw) : null,
    });
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/admin/scheduling");
  return { ok: true };
}
