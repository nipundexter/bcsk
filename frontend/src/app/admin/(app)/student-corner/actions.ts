"use server";

import { revalidatePath } from "next/cache";
import { requirePermission, audit } from "@/lib/auth";
import { db } from "@/lib/db";

export type CornerState = { ok?: boolean; error?: string } | null;

export async function saveCornerPost(_prev: CornerState, formData: FormData): Promise<CornerState> {
  const admin = await requirePermission("content:manage");
  const id = Number(formData.get("id") ?? 0);
  const data = {
    title: String(formData.get("title") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim(),
    studentName: String(formData.get("studentName") ?? "").trim(),
    kind: String(formData.get("kind") ?? "ARTICLE"),
    published: formData.get("published") === "on",
  };
  if (!data.title || !data.body || !data.studentName) return { error: "Title, body, and student name are required." };
  if (id) await db.studentCornerPost.update({ where: { id }, data });
  else await db.studentCornerPost.create({ data });
  await audit(admin.userId, "CONTENT_EDIT", "StudentCornerPost", id || "new", data.title);
  revalidatePath("/student-corner");
  revalidatePath("/admin/student-corner");
  return { ok: true };
}

export async function deleteCornerPost(id: number) {
  const admin = await requirePermission("content:manage");
  await db.studentCornerPost.delete({ where: { id } });
  await audit(admin.userId, "CONTENT_DELETE", "StudentCornerPost", id);
  revalidatePath("/student-corner");
  revalidatePath("/admin/student-corner");
}
