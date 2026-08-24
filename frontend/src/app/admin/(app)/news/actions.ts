"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { admin, toActionError } from "@/services";

export type NewsState = { ok?: boolean; error?: string } | null;

/** FR-NEWS-01 (admin side): one endpoint creates or updates, keyed on the presence of an id. */
export async function saveNews(_prev: NewsState, formData: FormData): Promise<NewsState> {
  await requirePermission("content:manage");
  const id = Number(formData.get("id") ?? 0);
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return { error: "Title and body are required." };

  try {
    await admin.saveNews({
      ...(id ? { id } : {}),
      type: String(formData.get("type") ?? "NEWS"),
      title,
      body,
      date: String(formData.get("date") ?? "") || new Date().toISOString().slice(0, 10),
      published: formData.get("published") === "on",
    });
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/events/news");
  revalidatePath("/admin/news");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteNews(id: number) {
  await requirePermission("content:manage");
  await admin.deleteNews(id);
  revalidatePath("/events/news");
  revalidatePath("/admin/news");
}
