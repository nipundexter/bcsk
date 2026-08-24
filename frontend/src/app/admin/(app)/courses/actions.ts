"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { admin, files, toActionError } from "@/services";

export type CourseState = { ok?: boolean; error?: string } | null;

/** FR-ADMIN-07: manage Course, Level, Syllabus and Book records. */
export async function updateCourse(_prev: CourseState, formData: FormData): Promise<CourseState> {
  await requirePermission("courses:manage");
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Course name is required." };
  try {
    await admin.updateCourse(id, {
      name,
      description: String(formData.get("description") ?? "").trim(),
      active: formData.get("active") === "on",
    });
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/admin/courses");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateLevel(_prev: CourseState, formData: FormData): Promise<CourseState> {
  await requirePermission("courses:manage");
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Level name is required." };

  const input: Record<string, unknown> = { name, syllabus: String(formData.get("syllabus") ?? "").trim() };
  try {
    // Books are PDFs in the `books` folder — staff-only to read, per the file policy.
    for (const [field, column] of [
      ["studentBook", "studentBookUrl"],
      ["workBook", "workBookUrl"],
    ] as const) {
      const file = formData.get(field);
      if (file instanceof File && file.size > 0) {
        input[column] = (await files.upload(file, "books")).path;
      }
    }
    await admin.updateLevel(id, input);
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/admin/courses");
  revalidatePath("/courses/abacus");
  revalidatePath("/courses/ielts-for-kids");
  revalidatePath("/courses/deen");
  return { ok: true };
}

export async function addLevel(courseId: number) {
  await requirePermission("courses:manage");
  await admin.addLevel(courseId);
  revalidatePath("/admin/courses");
}
