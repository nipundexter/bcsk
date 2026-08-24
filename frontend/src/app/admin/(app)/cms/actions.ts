"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { admin, toActionError } from "@/services";

export type CmsState = { ok?: boolean; error?: string } | null;

/**
 * FR-ADMIN-02 / UC-5 — create, edit and publish content pages per language.
 *
 * Slug normalisation and the language allowlist moved to the backend, which is where they
 * have to be: a Server Action is a public HTTP endpoint, so validating only here validated
 * nothing. The check stays duplicated on the form for the error message.
 */
export async function savePage(_prev: CmsState, formData: FormData): Promise<CmsState> {
  await requirePermission("content:manage");
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const lang = String(formData.get("lang") ?? "en");
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "");
  if (!slug || !title) return { error: "Slug and title are required." };
  if (!["en", "bn", "ko"].includes(lang)) return { error: "Unknown language." };

  try {
    await admin.savePage({ slug, lang, title, content, publish: formData.get("publish") === "on" });
  } catch (e) {
    return toActionError(e);
  }
  revalidatePath("/", "layout"); // public site reflects immediately (UC-5)
  return { ok: true };
}

export async function deletePage(slug: string, lang: string) {
  await requirePermission("content:manage");
  await admin.deletePage(slug, lang);
  revalidatePath("/", "layout");
  redirect("/admin/cms");
}
