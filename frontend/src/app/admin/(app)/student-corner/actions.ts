"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { admin, toActionError } from "@/services";

export type CornerState = { ok?: boolean; error?: string } | null;

/** FR-NEWS-03 (admin side): curate student articles, poems, artwork and achievements. */
export async function saveCornerPost(_prev: CornerState, formData: FormData): Promise<CornerState> {
  await requirePermission("content:manage");
  const id = Number(formData.get("id") ?? 0);
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const studentName = String(formData.get("studentName") ?? "").trim();
  if (!title || !body || !studentName) return { error: "Title, body, and student name are required." };

  try {
    await admin.saveCornerPost({
      ...(id ? { id } : {}),
      title,
      body,
      studentName,
      kind: String(formData.get("kind") ?? "ARTICLE"),
      published: formData.get("published") === "on",
    });
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/student-corner");
  revalidatePath("/admin/student-corner");
  return { ok: true };
}

export async function deleteCornerPost(id: number) {
  await requirePermission("content:manage");
  await admin.deleteCornerPost(id);
  revalidatePath("/student-corner");
  revalidatePath("/admin/student-corner");
}
