"use server";

import { revalidatePath } from "next/cache";
import { requirePermission, audit } from "@/lib/auth";
import { db } from "@/lib/db";

export type NewsState = { ok?: boolean; error?: string } | null;

export async function saveNews(_prev: NewsState, formData: FormData): Promise<NewsState> {
  const admin = await requirePermission("content:manage");
  const id = Number(formData.get("id") ?? 0);
  const data = {
    type: String(formData.get("type") ?? "NEWS"),
    title: String(formData.get("title") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim(),
    date: new Date(String(formData.get("date") ?? new Date().toISOString().slice(0, 10))),
    published: formData.get("published") === "on",
  };
  if (!data.title || !data.body) return { error: "Title and body are required." };
  if (id) {
    await db.eventNews.update({ where: { id }, data });
  } else {
    await db.eventNews.create({ data });
  }
  await audit(admin.userId, "CONTENT_EDIT", "EventNews", id || "new", data.title);
  revalidatePath("/events/news");
  revalidatePath("/admin/news");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteNews(id: number) {
  const admin = await requirePermission("content:manage");
  await db.eventNews.delete({ where: { id } });
  await audit(admin.userId, "CONTENT_DELETE", "EventNews", id);
  revalidatePath("/events/news");
  revalidatePath("/admin/news");
}
