"use server";

import { revalidatePath } from "next/cache";
import { requirePermission, audit } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveUpload } from "@/lib/uploads";

export type CourseState = { ok?: boolean; error?: string } | null;

export async function updateCourse(_prev: CourseState, formData: FormData): Promise<CourseState> {
  const admin = await requirePermission("courses:manage");
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!name) return { error: "Course name is required." };
  await db.course.update({
    where: { id },
    data: { name, description, active: formData.get("active") === "on" },
  });
  await audit(admin.userId, "COURSE_UPDATE", "Course", id);
  revalidatePath("/admin/courses");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateLevel(_prev: CourseState, formData: FormData): Promise<CourseState> {
  const admin = await requirePermission("courses:manage");
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const syllabus = String(formData.get("syllabus") ?? "").trim();
  if (!name) return { error: "Level name is required." };

  const data: Record<string, unknown> = { name, syllabus };
  for (const field of ["studentBook", "workBook"] as const) {
    const file = formData.get(field) as File | null;
    if (file && file.size > 0) {
      const saved = await saveUpload(file, "books", 30 * 1024 * 1024);
      if ("error" in saved) return { error: saved.error };
      data[field === "studentBook" ? "studentBookUrl" : "workBookUrl"] = saved.path;
    }
  }
  await db.courseLevel.update({ where: { id }, data });
  await audit(admin.userId, "COURSE_LEVEL_UPDATE", "CourseLevel", id);
  revalidatePath("/admin/courses");
  revalidatePath("/courses/abacus");
  revalidatePath("/courses/ielts-for-kids");
  revalidatePath("/courses/deen");
  return { ok: true };
}

export async function addLevel(courseId: number) {
  const admin = await requirePermission("courses:manage");
  const count = await db.courseLevel.count({ where: { courseId } });
  await db.courseLevel.create({
    data: { courseId, name: `Level ${count}`, displayOrder: count, syllabus: "" },
  });
  await audit(admin.userId, "COURSE_LEVEL_CREATE", "Course", courseId);
  revalidatePath("/admin/courses");
}
