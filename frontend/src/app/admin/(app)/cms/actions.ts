"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePermission, audit } from "@/lib/auth";
import { db } from "@/lib/db";

export type CmsState = { ok?: boolean; error?: string } | null;

/** FR-ADMIN-02 / UC-5: create/edit/publish content pages per language. */
export async function savePage(_prev: CmsState, formData: FormData): Promise<CmsState> {
  const admin = await requirePermission("content:manage");
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const lang = String(formData.get("lang") ?? "en");
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "");
  const status = formData.get("publish") === "on" ? "PUBLISHED" : "DRAFT";
  if (!slug || !title) return { error: "Slug and title are required." };
  if (!["en", "bn", "ko"].includes(lang)) return { error: "Unknown language." };

  await db.contentPage.upsert({
    where: { slug_lang: { slug, lang } },
    update: { title, content, status, updatedById: admin.userId },
    create: { slug, lang, title, content, status, updatedById: admin.userId },
  });
  await audit(admin.userId, "CONTENT_EDIT", "ContentPage", `${slug}/${lang}`, status);
  revalidatePath("/", "layout"); // public site reflects immediately (UC-5)
  return { ok: true };
}

export async function deletePage(slug: string, lang: string) {
  const admin = await requirePermission("content:manage");
  await db.contentPage.delete({ where: { slug_lang: { slug, lang } } });
  await audit(admin.userId, "CONTENT_DELETE", "ContentPage", `${slug}/${lang}`);
  revalidatePath("/", "layout");
  redirect("/admin/cms");
}
