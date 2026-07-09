"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, audit } from "@/lib/auth";
import { db } from "@/lib/db";
import { SEMESTER_CURRENT } from "@/lib/constants";

export type SchedState = { ok?: boolean; error?: string } | null;

export async function updateSession(_prev: SchedState, formData: FormData): Promise<SchedState> {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  const teacherIdRaw = String(formData.get("teacherId") ?? "");
  await db.classSession.update({
    where: { id },
    data: {
      dayOfWeek: String(formData.get("dayOfWeek") ?? "Saturday"),
      startTime: String(formData.get("startTime") ?? "10:00"),
      endTime: String(formData.get("endTime") ?? "") || null,
      teacherId: teacherIdRaw ? Number(teacherIdRaw) : null,
      zoomLink: String(formData.get("zoomLink") ?? "") || null,
      active: formData.get("active") === "on",
    },
  });
  await audit(admin.userId, "SCHEDULE_UPDATE", "ClassSession", id);
  revalidatePath("/admin/scheduling");
  revalidatePath("/classroom/dashboard");
  revalidatePath("/office/dashboard");
  return { ok: true };
}

export async function createSession(_prev: SchedState, formData: FormData): Promise<SchedState> {
  const admin = await requireAdmin();
  const courseId = Number(formData.get("courseId"));
  const title = String(formData.get("title") ?? "").trim();
  if (!courseId || !title) return { error: "Course and title are required." };
  const levelIdRaw = String(formData.get("courseLevelId") ?? "");
  const classLevelRaw = String(formData.get("classLevel") ?? "");
  const teacherIdRaw = String(formData.get("teacherId") ?? "");
  await db.classSession.create({
    data: {
      courseId,
      courseLevelId: levelIdRaw ? Number(levelIdRaw) : null,
      classLevel: classLevelRaw || null,
      title,
      dayOfWeek: String(formData.get("dayOfWeek") ?? "Saturday"),
      startTime: String(formData.get("startTime") ?? "10:00"),
      endTime: String(formData.get("endTime") ?? "") || null,
      semester: SEMESTER_CURRENT,
      teacherId: teacherIdRaw ? Number(teacherIdRaw) : null,
    },
  });
  await audit(admin.userId, "SCHEDULE_CREATE", "ClassSession", title);
  revalidatePath("/admin/scheduling");
  return { ok: true };
}
